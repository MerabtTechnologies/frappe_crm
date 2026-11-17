"""Database-free merge regressions. Run directly with Python, not bench run-tests."""

import importlib.util
import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType, SimpleNamespace
from unittest.mock import MagicMock, patch

APPS = Path(__file__).resolve().parents[3]
CRM = APPS / "crm"
FACEBOOK_PATH = CRM / "crm/lead_syncing/doctype/lead_sync_source/facebook.py"
ACTIVITIES_PATH = APPS / "merabt_crm/merabt_crm/portal_api/activities.py"
LAYOUT_PATH = APPS / "merabt_crm/merabt_crm/merabt_crm/override/crm_field_layout.py"


def load_module(path, name):
	spec = importlib.util.spec_from_file_location(name, path)
	module = importlib.util.module_from_spec(spec)
	spec.loader.exec_module(module)
	return module


def module_stub(name, **attributes):
	module = ModuleType(name)
	module.__dict__.update(attributes)
	return module


class MergeCompatibilityTest(unittest.TestCase):
	def setUp(self):
		self.frappe = MagicMock()
		self.frappe.whitelist.side_effect = lambda *args, **kwargs: lambda function: function
		self.frappe._.side_effect = lambda value: value
		self.frappe.PermissionError = PermissionError
		self.frappe.ValidationError = ValueError
		self.frappe.UniqueValidationError = type("UniqueValidationError", (Exception,), {})
		self.frappe.throw.side_effect = lambda message, error=Exception: self.fail_permission(message, error)
		self.frappe.as_json.side_effect = json.dumps
		self.core = MagicMock()
		self.utils = module_stub(
			"frappe.utils",
			get_datetime=lambda value: datetime.fromisoformat(value) if isinstance(value, str) else value,
			get_system_timezone=lambda: "Asia/Karachi",
			now_datetime=lambda: datetime(2026, 9, 16, 14, 37),
			random_string=lambda size: "x" * size,
		)
		self.campaigns = MagicMock()
		self.campaigns.pretty_date.side_effect = lambda value: value
		modules = {
			"frappe": self.frappe,
			"frappe.exceptions": module_stub("frappe.exceptions", ValidationError=Exception),
			"frappe.integrations": ModuleType("frappe.integrations"),
			"frappe.integrations.utils": MagicMock(),
			"frappe.utils": self.utils,
			"frappe.desk": ModuleType("frappe.desk"),
			"frappe.desk.form": ModuleType("frappe.desk.form"),
			"frappe.desk.form.load": MagicMock(),
			"bs4": MagicMock(),
			"crm.api.activities": self.core,
			"crm.lead_syncing.doctype.lead_sync_source.facebook_sync_campaigns": self.campaigns,
		}
		self.patcher = patch.dict(sys.modules, modules)
		self.patcher.start()
		self.addCleanup(self.patcher.stop)

	@staticmethod
	def fail_permission(message, error):
		raise error(message)

	def facebook(self):
		return load_module(FACEBOOK_PATH, "facebook_merge_test")

	def activities(self):
		return load_module(ACTIVITIES_PATH, "activities_merge_test")

	def test_facebook_site_timezone_and_overlap(self):
		facebook = self.facebook()
		self.frappe.db.get_value.return_value = "2026-09-16 14:37:00"
		facebook.make_get_request.return_value = {"data": []}
		facebook.FacebookSyncSource("fixture", "form", "source").fetch_leads()
		params = facebook.make_get_request.call_args.kwargs["params"]
		actual = json.loads(params["filtering"])[0]["value"]
		expected = int(datetime(2026, 9, 16, 9, 37, tzinfo=timezone.utc).timestamp()) - 300
		self.assertEqual(actual, expected)
		self.assertIn("campaign_id", params["fields"])

	def test_facebook_first_sync_and_start_timestamp(self):
		facebook = self.facebook()
		self.frappe.db.get_value.return_value = None
		facebook.make_get_request.return_value = {"data": []}
		facebook.FacebookSyncSource("fixture", "form", "source").sync()
		self.assertNotIn("filtering", facebook.make_get_request.call_args.kwargs["params"])
		self.frappe.db.set_value.assert_called_once_with(
			"Lead Sync Source", "source", "last_synced_at", datetime(2026, 9, 16, 14, 37)
		)

	def test_facebook_existing_lead_is_skipped(self):
		facebook = self.facebook()
		self.frappe.db.exists.return_value = True
		facebook.FacebookSyncSource("fixture", "form").sync_single_lead({"id": "existing"})
		self.frappe.get_doc.assert_not_called()
		self.frappe.db.get_all.assert_not_called()

	def test_facebook_empty_values_and_custom_metadata(self):
		facebook = self.facebook()
		self.frappe.db.exists.return_value = False
		source = facebook.FacebookSyncSource("fixture", "form")
		source.form_questions_mapping = {"full_name": "first_name", "email": "email"}
		source.sync_single_lead(
			{
				"id": "new",
				"created_time": "2026-09-16T01:08:36+0500",
				"ad_id": "ad",
				"campaign_id": "campaign",
				"ad_name": "Ad",
				"campaign_name": "Campaign",
				"field_data": [{"name": "full_name", "values": ["Sample"]}, {"name": "email"}],
			}
		)
		data = self.frappe.get_doc.call_args.args[0]
		self.assertEqual(data["first_name"], "Sample")
		self.assertEqual(data["custom_meta_ad_name"], "ad")
		self.assertEqual(data["custom_meta_campaign"], "campaign")
		self.assertEqual(data["facebook_campaign_name"], "Campaign")
		self.assertEqual(data["facebook_form_id"], "form")
		self.assertEqual(data["custom_custom_form_questions"], "{'full_name': 'Sample'}")
		self.assertNotIn("email", data)
		duplicate_filters = self.frappe.db.exists.call_args.args[1]
		self.assertEqual(duplicate_filters["email"], ("is", "not set"))
		self.frappe.get_doc.return_value.insert.assert_called_once_with(ignore_permissions=True)

	def test_facebook_campaign_account_and_ad_sync_are_preserved(self):
		facebook = self.facebook()
		parsed = {
			"ad_accounts": [{"id": "account"}],
			"campaigns": [{"id": "campaign"}],
			"ads": [{"id": "ad"}],
		}
		self.campaigns.parse_meta_ads_response.return_value = parsed
		facebook.sync_meta_ad_account_ads("fixture")
		self.campaigns.create_facebook_ad_accounts_in_db.assert_called_once_with(parsed["ad_accounts"])
		self.campaigns.create_facebook_campaigns_in_db.assert_called_once_with(parsed["campaigns"])
		self.campaigns.create_facebook_ads_in_db.assert_called_once_with(parsed["ads"])

	def test_deal_delegates_core_timeline_and_appends_permitted_quotations(self):
		activities = self.activities()
		core_result = ([{"name": "email", "data": {"send_after": "later"}}], [], [{"pinned": 1}], [], [])
		self.core.get_deal_activities.return_value = core_result
		self.frappe.get_list.return_value = [{"name": "quotation"}]
		result = activities.get_deal_activities("deal")
		self.assertEqual(len(result), 6)
		for actual, expected in zip(result[:5], core_result, strict=True):
			self.assertIs(actual, expected)
		self.assertEqual(result[5], [{"name": "quotation"}])
		self.core.get_deal_activities.assert_called_once_with("deal")
		self.frappe.get_list.assert_called_once_with(
			"Quotation", filters={"crm_deal": "deal"}, fields=["*"], limit_page_length=0
		)

	def test_deal_permission_failure_does_not_fetch_quotations(self):
		activities = self.activities()
		self.core.get_deal_activities.side_effect = PermissionError
		with self.assertRaises(PermissionError):
			activities.get_deal_activities("private")
		self.frappe.get_list.assert_not_called()

	def test_quotation_permission_failure_keeps_standard_five_collections(self):
		activities = self.activities()
		self.core.get_deal_activities.return_value = ([], [], [], [], [])
		self.frappe.has_permission.return_value = False
		self.assertEqual(activities.get_deal_activities("deal"), ([], [], [], [], [], []))
		self.frappe.get_list.assert_not_called()

	def test_custom_activity_families_enforce_read_permission_before_docinfo(self):
		activities = self.activities()
		self.frappe.has_permission.return_value = False
		families = {
			"Smart Project": "project",
			"Smart Task": "task",
			"Employee Project Assignment": "employee_project_assignment",
			"Employee Date Request": "employee_date_request",
			"Smart Timesheet": "smart_timesheet",
			"Gamma Proposal": "gamma_proposal",
			"Event": "event",
			"Quotation": "quotation",
		}
		for doctype, family in families.items():
			with self.subTest(doctype=doctype), self.assertRaises(PermissionError):
				getattr(activities, f"get_{family}_activities")("private")
			self.frappe.has_permission.assert_called_with(doctype, "read", "private")
		activities.get_docinfo.assert_not_called()

	def test_custom_notes_include_upstream_metadata(self):
		activities = self.activities()
		activities.get_linked_notes("project")
		fields = self.frappe.db.get_all.call_args.kwargs["fields"]
		self.assertTrue({"creation", "pinned", "pinned_by", "pinned_on"}.issubset(fields))

	def test_custom_timelines_include_email_identity_and_scheduling(self):
		activities = self.activities()
		created = datetime(2026, 9, 16, 10)
		sent = datetime(2026, 9, 16, 11)
		communication = SimpleNamespace(
			name="email",
			communication_type="Communication",
			communication_date=sent,
			creation=created,
			subject="Subject",
			content="Body",
			sender_full_name="Sender",
			sender="sender@example.com",
			recipients="recipient@example.com",
			cc="",
			bcc="",
			read_by_recipient=0,
			delivery_status="Scheduled",
		)
		self.frappe.response = {
			"docinfo": SimpleNamespace(
				versions=[],
				comments=[],
				communications=[communication],
				automated_messages=[],
				attachment_logs=[],
			)
		}
		self.frappe.get_meta.return_value.fields = []
		self.frappe.db.get_values.return_value = [(created, "owner")]
		self.frappe.db.get_all.return_value = []
		self.core.get_note_activities.return_value = []
		self.core.group_note_activities.side_effect = lambda rows: rows
		self.core.get_send_after.return_value = "2026-09-17 10:00:00"
		for family in (
			"project",
			"task",
			"employee_date_request",
			"employee_project_assignment",
			"smart_timesheet",
			"gamma_proposal",
			"event",
			"quotation",
		):
			with self.subTest(family=family):
				self.core.get_note_activities.reset_mock()
				result = getattr(activities, f"get_{family}_activities")("record")
				self.assertEqual(len(result), 6 if family == "quotation" else 5)
				email = next(row for row in result[0] if row["activity_type"] == "communication")
				self.assertEqual(email["name"], "email")
				self.assertEqual(email["creation"], sent)
				self.assertEqual(email["data"]["send_after"], "2026-09-17 10:00:00")
				self.core.get_note_activities.assert_called_once_with([], is_lead=False)

	def contacts(self):
		return load_module(APPS / "merabt_crm/merabt_crm/portal_api/contacts.py", "contacts_merge_test")

	def contact_doc(self, rows=()):
		doc = MagicMock()
		doc.name = "custom-record"
		doc.meta.fields = [SimpleNamespace(fieldname="contacts", fieldtype="Table", options="CRM Contacts")]
		doc.get.return_value = list(rows)
		self.frappe.get_doc.return_value = doc
		return doc

	def test_custom_contacts_do_not_query_crm_deals(self):
		doc = self.contact_doc()
		doc.meta.fields = []
		self.assertEqual(self.contacts().get_contacts("Quotation", "Q-1"), [])
		self.frappe.get_doc.assert_called_once_with("Quotation", "Q-1")
		doc.check_permission.assert_called_once_with("read")

	def test_custom_contact_reads_respect_document_and_contact_permissions(self):
		doc = self.contact_doc([SimpleNamespace(contact="private", is_primary=1)])
		self.frappe.has_permission.return_value = False
		self.assertEqual(self.contacts().get_contacts("Event", "E-1"), [])
		self.frappe.get_doc.assert_called_once_with("Event", "E-1")
		doc.check_permission.side_effect = PermissionError
		with self.assertRaises(PermissionError):
			self.contacts().get_contacts("Event", "E-1")

	def test_contact_writes_do_not_bypass_permissions(self):
		doc = self.contact_doc()
		doc.check_permission.side_effect = PermissionError
		with self.assertRaises(PermissionError):
			self.contacts().update_contact("Gamma Proposal", "G-1", "C-1", "add")
		doc.check_permission.assert_called_once_with("write")
		doc.save.assert_not_called()
		doc.append.assert_not_called()

	def test_contact_add_and_primary_use_custom_document_table(self):
		doc = self.contact_doc()
		self.contacts().update_contact("Quotation", "Q-1", "C-1", "add")
		doc.append.assert_called_once_with("contacts", {"contact": "C-1", "is_primary": True})
		doc.save.assert_called_once_with()
		rows = [SimpleNamespace(contact="C-1", is_primary=1), SimpleNamespace(contact="C-2", is_primary=0)]
		doc = self.contact_doc(rows)
		self.contacts().update_contact("Event", "E-1", "C-2", "primary")
		self.assertEqual([row.is_primary for row in rows], [False, True])
		doc.save.assert_called_once_with()

	def test_unsupported_contact_schema_and_actions_fail_without_saving(self):
		contacts = self.contacts()
		doc = self.contact_doc()
		for action in ["unknown", "primary"]:
			with self.subTest(action=action), self.assertRaises(ValueError):
				contacts.update_contact("Quotation", "Q-1", "C-1", action)
		doc.meta.fields = []
		with self.assertRaises(ValueError):
			contacts.update_contact("Quotation", "Q-1", "C-1", "add")
		doc.save.assert_not_called()
		self.frappe.get_doc.reset_mock()
		with self.assertRaises(ValueError):
			contacts.get_contacts("User", "Administrator")
		self.frappe.get_doc.assert_not_called()

	def call_filters(self):
		return load_module(CRM / "crm/api/call_filters.py", "call_filters_merge_test")

	def test_call_participant_matches_either_side_with_existing_scope(self):
		filters = {"call_participant": "user@example.test", "name": ["in", ["A", "B"]], "type": "Incoming"}
		self.frappe.get_list.return_value = ["B"]
		self.call_filters().apply_call_participant_filter("CRM Call Log", filters)
		self.frappe.get_list.assert_called_once_with(
			"CRM Call Log",
			filters={"name": ["in", ["A", "B"]], "type": "Incoming"},
			or_filters={"caller": "user@example.test", "receiver": "user@example.test"},
			pluck="name",
			limit_page_length=0,
		)
		self.assertEqual(filters, {"name": ["in", ["B"]], "type": "Incoming"})

	def test_call_unassigned_requires_both_sides_unassigned(self):
		filters = {"call_participant": ["is", "not set"]}
		self.call_filters().apply_call_participant_filter("CRM Call Log", filters)
		self.assertEqual(filters, {"caller": ["is", "not set"], "receiver": ["is", "not set"]})
		self.frappe.get_list.assert_not_called()

	def test_unassigned_filter_does_not_replace_an_explicit_participant(self):
		filters = {"call_participant": ["is", "not set"], "caller": "user@example.test"}
		self.frappe.get_list.return_value = []
		self.call_filters().apply_call_participant_filter("CRM Call Log", filters)
		self.assertEqual(filters, {"caller": "user@example.test", "name": ["in", []]})
		self.frappe.get_list.assert_called_once_with(
			"CRM Call Log",
			filters=[
				["caller", "=", "user@example.test"],
				["caller", "is", "not set"],
				["receiver", "is", "not set"],
			],
			pluck="name",
			limit_page_length=0,
		)

	def test_invalid_call_participant_cannot_widen_query(self):
		for value in [None, "", ["like", "%"], ["=", None], {}]:
			with self.subTest(value=value), self.assertRaises(ValueError):
				self.call_filters().apply_call_participant_filter("CRM Call Log", {"call_participant": value})
		self.frappe.get_list.assert_not_called()

	def test_layout_save_preserves_upstream_permission_gate(self):
		with patch("importlib.import_module", return_value=MagicMock()):
			layout = load_module(LAYOUT_PATH, "layout_merge_test")
		self.frappe.has_permission.return_value = False
		with self.assertRaises(PermissionError):
			layout.save_fields_layout("CRM Deal", "Data Fields", "[]")
		self.frappe.db.get_single_value.assert_not_called()
		self.frappe.new_doc.assert_not_called()

	def test_layout_save_creates_category_layout_without_renaming_fallback(self):
		with patch("importlib.import_module", return_value=MagicMock()):
			layout = load_module(LAYOUT_PATH, "layout_merge_test")
		self.frappe.db.get_single_value.return_value = "Education"
		self.frappe.db.exists.return_value = None
		doc = self.frappe.new_doc.return_value
		doc.name = "new-layout"
		layout.save_fields_layout("Smart Project", "Data Fields", "[]")
		self.frappe.get_doc.assert_not_called()
		self.frappe.new_doc.assert_called_once_with("CRM Fields Layout")
		self.assertEqual(doc.name, "new-layout")
		self.assertEqual(doc.custom_company_category, "Education")
		doc.save.assert_called_once_with()

	def test_layout_save_updates_only_the_exact_category(self):
		with patch("importlib.import_module", return_value=MagicMock()):
			layout = load_module(LAYOUT_PATH, "layout_merge_test")
		self.frappe.db.get_single_value.return_value = "Education"
		self.frappe.db.exists.return_value = "exact-layout"
		layout.save_fields_layout("Smart Project", "Data Fields", "[]")
		self.frappe.db.exists.assert_called_once_with(
			"CRM Fields Layout",
			{
				"dt": "Smart Project",
				"type": "Data Fields",
				"custom_company_category": "Education",
			},
		)
		self.frappe.get_doc.assert_called_once_with("CRM Fields Layout", "exact-layout")
		self.frappe.new_doc.assert_not_called()
		self.frappe.get_doc.return_value.save.assert_called_once_with()


if __name__ == "__main__":
	unittest.main()
