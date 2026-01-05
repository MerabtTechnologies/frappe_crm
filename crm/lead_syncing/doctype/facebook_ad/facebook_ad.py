# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class FacebookAd(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from crm.lead_syncing.doctype.facebook_form_id.facebook_form_id import FacebookFormId
		from frappe.types import DF

		ad_account: DF.Link | None
		ad_name: DF.Data | None
		campaign: DF.Link | None
		id: DF.Data
		table_forms: DF.Table[FacebookFormId]
	# end: auto-generated types
	pass
