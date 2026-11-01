# 🛡️ AKG ALGO · Silent License Binding (MQL4 / MQL5)

This guide provides the exact copy-paste code snippet and MetaTrader configuration needed to integrate your EAs with the AKG ALGO silent license binding system.

---

## 1. MetaTrader Configuration (Allow WebRequest)

MetaTrader blocks external HTTP requests by default. Before running the EA:

1. Open **MetaTrader 4** or **MetaTrader 5**.
2. Click **Tools** → **Options** (or press `Ctrl + O`).
3. Select the **Expert Advisors** tab.
4. Check **"Allow WebRequest for listed URL"**.
5. Click **Add new URL** (`+`) and paste your server endpoint:
   ```
   http://127.0.0.1:8095
   ```
   *(or your live domain, e.g. `https://your-domain.com`)*
6. Click **OK**.

---

## 2. MQL4 / MQL5 Snippet

Paste this snippet into your EA (`.mq4` or `.mq5`):

```mql
//+------------------------------------------------------------------+
//|                                              AKG_LicenseGuard.mqh |
//|                               Copyright 2026, AKG ALGO Systems    |
//+------------------------------------------------------------------+
#property strict

// 1. Add input parameter for the user
input string InpLicenseKey = ""; // AKG License Key (from My Account)

// 2. Call this function in OnInit()
int OnInit()
{
   if(!VerifyAKGLicense(InpLicenseKey))
   {
      Print("[AKG] License verification failed. EA stopped.");
      return INIT_FAILED;
   }
   
   Print("[AKG] License authorized. Initializing trading strategy...");
   // Continue your normal OnInit logic...
   return INIT_SUCCEEDED;
}

// 3. Verification function with silent first-run binding
bool VerifyAKGLicense(string licenseKey)
{
   licenseKey = StringTrimLeft(StringTrimRight(licenseKey));
   if(StringLen(licenseKey) == 0)
   {
      Alert("[AKG ALGO] Error: License key is empty. Enter your license key in the EA inputs.");
      return false;
   }
   
   // Set to your desk URL:
   string serverUrl = "http://127.0.0.1:8095/api/license/verify";
   string headers = "Content-Type: application/json\r\nUser-Agent: AKG-EA-Terminal\r\n";
   
   string platform = "MT5";
   #ifndef __MQL5__
   platform = "MT4";
   #endif
   
   string postData = StringFormat(
      "{\"key\":\"%s\",\"account\":\"%d\",\"platform\":\"%s\"}",
      licenseKey,
      (long)AccountNumber(),
      platform
   );
   
   char post[], result[];
   string resultHeaders;
   StringToCharArray(postData, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post) - 1); // strip trailing null
   
   ResetLastError();
   int res = WebRequest("POST", serverUrl, headers, 6000, post, result, resultHeaders);
   
   if(res == -1)
   {
      int err = GetLastError();
      PrintFormat("[AKG ALGO] WebRequest failed (%d). Ensure '%s' is in Tools -> Options -> Expert Advisors -> Allow WebRequest.", err, serverUrl);
      return false;
   }
   
   string response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   PrintFormat("[AKG ALGO] Verification response (%d): %s", res, response);
   
   // HTTP 200 and "valid":true confirms active license
   if(res == 200 && StringFind(response, "\"valid\":true") >= 0)
   {
      Print("[AKG ALGO] License valid. Account binding active.");
      return true;
   }
   
   if(res == 403)
   {
      Alert("[AKG ALGO] Access Denied: This license key is permanently bound to another MetaTrader account number.");
   }
   else if(res == 404)
   {
      Alert("[AKG ALGO] Invalid Key: License key not found or payment pending desk approval.");
   }
   else if(res == 429)
   {
      Alert("[AKG ALGO] Rate limit: Too many verification attempts. Please wait 1 minute.");
   }
   else
   {
      Alert(StringFormat("[AKG ALGO] Verification failed with status %d.", res));
   }
   
   return false;
}
```

---

## 3. How the Silent Binding Flow Works

1. **User Purchases Bot:** The user pays via USDT/UPI and submits TXID.
2. **Desk Approves Payment:** Desk admin clicks "Approve + Issue License". A unique key is issued (e.g. `AKG-MT5-A91B-7C34`).
3. **User Attaches EA:** User copies key from **My Account** into the EA inputs dialog in MetaTrader.
4. **Silent Binding on First Run:** When the EA initializes, it sends `POST /api/license/verify`. Because the license has no bound account yet, the server automatically records the trader's `AccountNumber()` and timestamp (`bound_at`), returning valid.
5. **Subsequent Runs:** Any future call from the same account number returns valid. If the EA is attached to a different MetaTrader account number, the server rejects it (`403 Mismatch`).
6. **Support Case / Reset:** If a trader migrates to a new broker account, the admin can click **"Reset Binding"** in the Admin Money Queue to allow re-binding.
