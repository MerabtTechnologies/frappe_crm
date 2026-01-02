import frappe
from datetime import datetime
import pytz


def parse_meta_ads_response(response: dict):
    """
    Parse Meta Graph API response and return unique
    ad_accounts, campaigns, and ads with unique form_ids list
    ready for Frappe insertion.
    """

    ad_accounts_map = {}
    campaigns_map = {}
    ads_map = {}

    for account in response.get("data", []):
        ad_account_id = account.get("id")
        ad_account_name = account.get("name")
        business_name = account.get("business_name")

        # -------- Ad Accounts --------
        ad_accounts_map[ad_account_id] = {
            "ad_account_id": ad_account_id,
            "ad_account_name": ad_account_name,
            "business_name": business_name
        }

        # -------- Campaigns --------
        for campaign in account.get("campaigns", {}).get("data", []):
            campaign_id = campaign.get("id")
            campaign_name = campaign.get("name")

            campaigns_map[campaign_id] = {
                "campaign_id": campaign_id,
                "campaign_name": campaign_name,
                "ad_account_id": ad_account_id
            }

            # -------- Ads --------
            for ad in campaign.get("ads", {}).get("data", []):
                ad_id = ad.get("id")
                ad_name = ad.get("name")

                # Prefer IDs from ad object if present
                ad_account_fk = ad_account_id or  ad.get("account_id")
                campaign_fk = campaign_id or ad.get("campaign_id")

                # Initialize ad once
                if ad_id not in ads_map:
                    ads_map[ad_id] = {
                        "ad_id": ad_id,
                        "ad_name": ad_name,
                        "campaign_id": campaign_fk,
                        "ad_account_id": ad_account_fk,
                        "form_ids": set()
                    }

                # Collect form IDs from leads (if any)
                for lead in ad.get("leads", {}).get("data", []):
                    form_id = lead.get("form_id")
                    if form_id:
                        ads_map[ad_id]["form_ids"].add(form_id)

    # Convert form_ids set → list (Frappe friendly)
    ads = []
    for ad in ads_map.values():
        ad["form_ids"] = list(ad["form_ids"])
        ads.append(ad)

    return {
        "ad_accounts": list(ad_accounts_map.values()),
        "campaigns": list(campaigns_map.values()),
        "ads": ads
    }


def create_facebook_ad_accounts_in_db(ad_accounts: dict) -> None:
	for ad_account in ad_accounts:
		already_synced = frappe.db.exists("Facebook Ad Account", ad_account["ad_account_id"])
		if not already_synced:
			frappe.get_doc(
				{
					"doctype": "Facebook Ad Account",
					"id": ad_account["ad_account_id"],
					"ad_account_name": ad_account["ad_account_name"],
				}
			).insert(ignore_permissions=True)

def create_facebook_campaigns_in_db(campaigns: dict) -> None:
	for campaign in campaigns:
		already_synced = frappe.db.exists("Facebook Ad Campaign", campaign["campaign_id"])
		if not already_synced:
			frappe.get_doc(
				{
					"doctype": "Facebook Ad Campaign",
					"id": campaign["campaign_id"],
					"campaign_name": campaign["campaign_name"],
					"ad_account_id": campaign["ad_account_id"],
				}
			).insert(ignore_permissions=True)

def create_facebook_ads_in_db(ads: dict) -> None:
	for ad in ads:
		already_synced = frappe.db.exists("Facebook Ad", ad["ad_id"])
		if not already_synced:
			print(f"Creating ad: {ad}")
			frappe.get_doc(
				{
					"doctype": "Facebook Ad",
					"id": ad["ad_id"],
					"ad_name": ad["ad_name"],
					"campaign": ad["campaign_id"],
					"ad_account": ad["ad_account_id"],
					"table_forms": [{"lead_form_id": form_id} for form_id in ad["form_ids"]],
				}
			).insert(ignore_permissions=True)


def pretty_date(date_str):
    """
    Input:  2026-01-02T10:11:22+0000
    Output: 02 Jan 2026, 03:41 PM (IST)
    """
    # Parse ISO datetime with timezone
    dt = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S%z")

    # Convert to IST (optional but recommended for India)
    ist = pytz.timezone("Asia/Kolkata")
    dt = dt.astimezone(ist)

    return dt.strftime("%d %b %Y, %I:%M %p")