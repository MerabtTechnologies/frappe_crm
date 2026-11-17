import frappe
from frappe import _


def apply_call_participant_filter(doctype, filters):
	"""Resolve a dashboard participant filter without widening record permissions."""
	if doctype != "CRM Call Log" or "call_participant" not in filters:
		return
	participant = filters.pop("call_participant")
	if participant == ["is", "not set"]:
		if "caller" not in filters and "receiver" not in filters:
			filters.update({"caller": ["is", "not set"], "receiver": ["is", "not set"]})
			return
		lookup_filters = [
			[field, *value] if isinstance(value, list | tuple) else [field, "=", value]
			for field, value in filters.items()
		]
		lookup_filters.extend([["caller", "is", "not set"], ["receiver", "is", "not set"]])
		filters["name"] = [
			"in",
			frappe.get_list(
				doctype,
				filters=lookup_filters,
				pluck="name",
				limit_page_length=0,
			),
		]
		return
	if isinstance(participant, list | tuple):
		if len(participant) != 2 or participant[0] not in {"=", "equals"}:
			frappe.throw(_("Invalid call participant filter"), frappe.ValidationError)
		participant = participant[1]
	if not isinstance(participant, str) or not participant:
		frappe.throw(_("Invalid call participant filter"), frappe.ValidationError)
	names = frappe.get_list(
		doctype,
		filters=filters.copy(),
		or_filters={"caller": participant, "receiver": participant},
		pluck="name",
		limit_page_length=0,
	)
	filters["name"] = ["in", names]
