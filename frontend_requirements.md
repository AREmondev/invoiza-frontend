# Frontend Requirements Document

This document outlines the frontend-specific requirements derived from the comprehensive project requirements. These points primarily focus on user interface, user experience, and client-side interactions.

## 1. Sale Page Features

*   **Old Rate Display:** Show old rates on the sale page along with quantity and date.
*   **Category Filter:** Implement a category filter on the sale page rows.
*   **Column Visibility Toggle:** Allow users to hide or activate columns on the sale page.
*   **Due Date Display:** Display the due date on the sale page.
*   **Item Information Display:** Show item information like purchase rate, cost rate, quantity, location, expiry, batch, size, color on the sale page with active/deactivate options.
*   **Item Name Selection:** Display item names based on selected color.
*   **Preview Before Save:** Provide a preview of the sale before saving.
*   **Rate Update:** Allow updating rates directly from the sale page.
*   **Search on Every Row:** Implement search functionality on every row of the sale page.
*   **Total Bottom Panel Adjustment:** The total bottom panel should adjust with the page, not be fixed.
*   **Unit Change:** Implement functionality for unit changes.
*   **Watermark:** Display a watermark on the sale page.
*   **WhatsApp Integration (Send Invoice):** Functionality to send invoices via WhatsApp from the sale page.
*   **Elastic Search-like Search:** Implement a search engine with elastic search-like capabilities (e.g., "DIABETIC (ST)RIP (SA)FE TUCH (50) ## = sa 50 st show RESULT").
*   **Search with Phone Number:** Enable searching by phone number.
*   **Negative Sale Warning:** Display a warning during negative sales.
*   **Loss Invoice Red Color:** Loss invoice transactions should be highlighted in red.
*   **Zero Quantity Prohibition:** Prohibit saving sales with zero quantity.
*   **Prohibited Item Option:** Implement an option for prohibited items that won't appear in print.
*   **Purchase/Sell Rate Box/Pes Display Option:** Provide an option to display purchase/sell rates in box/pes.
*   **Edited Transaction History:** A column to indicate how many times a transaction has been edited.

## 2. Purchase Page Features

*   **Same as Sale Page:** All relevant frontend features from the sale page should also apply to the purchase page (e.g., old rate display, category filter, column visibility, item information display, preview before save, rate update, search on every row, total bottom panel adjustment, unit change, watermark, WhatsApp integration, elastic search-like search, search with phone number, negative purchase warning, loss invoice red color, zero quantity prohibition, prohibited item option, purchase/sell rate box/pes display option, edited transaction history).

## 3. Cash and Bank Features

*   **Transaction Display:** Display every transaction related to the bank with a link to the invoice.

## 4. Reports Features

*   **Every Table to Excel/PDF:** Functionality to convert every table in reports to Excel and PDF with item details.
*   **Column Filtering:** Implement column filtering (range, equal, less than, greater than) for item details and party details.

## 5. Utilities Features

*   **Export/Import Item:** Frontend interface for exporting and importing items.
*   **Export/Import Party:** Frontend interface for exporting and importing parties.

## 6. Item Management Features

*   **Item Active/Inactive System:** Frontend controls for activating/deactivating items.
*   **Item Details Display:** Display item details (type, date, party, invoice, quantity, price, cost, box, pack, sale rate, status, user, discount, profit/loss) with column filtering.
*   **Show Low Stock Dialog:** Display a dialog for low stock.
*   **Stop Sale on Negative Stock / Allow Negative Stock:** Frontend control for this setting.
*   **Variant Selection:** Frontend for managing item variants.

## 7. Party Management Features

*   **Enable Loyalty Point:** Frontend control to enable loyalty points.
*   **Party Details Display:** Display party details (type, date, party, invoice total, profit/loss, user, total, additional charge, balance, status, discount, profit/loss) with column filtering.
*   **Remind for Payment Due:** Frontend setting for payment due reminders.
*   **Party Active/Inactive:** Frontend controls for activating/deactivating parties.

## 8. General Features

*   **Audit Trail Display:** Display audit trail information.
*   **Billing Name of Parties:** Display billing name of parties.
*   **Discount During Payments:** Frontend for applying discounts during payments.
*   **Display Purchase Price of Items:** Display purchase price of items.
*   **Drag and Drop:** Implement drag and drop functionality.
*   **Due Dates and Payment Terms Display:** Display due dates and payment terms.
*   **Edit View History:** Display edit history.
*   **Free Item Quantity:** Frontend for managing free item quantity.
*   **Invoice Duplicate:** Functionality to duplicate invoices.
*   **Link Payments to Invoices:** Frontend for linking payments to invoices.
*   **Round Off Total:** Frontend display of rounded-off totals.
*   **Show Last 5 Purchase Price:** Display the last 5 purchase prices of items with supplier names.
*   **Show Last 5 Sale Price:** Display the last 5 sale prices of items.
*   **Show Profit while making Sale Invoice:** Display profit during sale invoice creation.
*   **Transaction Wise Discount:** Frontend for applying transaction-wise discounts.
*   **Users Activity Table:** Display users' activity table.
*   **Action Button:** Implement action buttons.
*   **View Customize:** Allow customization of views.
*   **Duplicate Invoice:** Functionality to duplicate invoices.
*   **Color-coded Transaction Status:** Use colors to indicate the status of each transaction.
*   **Column Hide Option:** Option to hide columns.
*   **Feature Active/Inactive Option:** Option to activate/deactivate each feature.

## 9. POS Page Features

*   **POS Sale Filter:** Implement POS sale filter with category, 2nd category, and brand, with elastic search.

## 10. HR Payroll Features

*   **Advance Salary Display:** Display advance salary information.
*   **Attendance Display:** Display attendance information.
*   **Product Target Display:** Display product target information.
*   **Salary Display:** Display salary information.
*   **Sale Target Display:** Display sale target information.

## Feedback for Improvement on Project Requirements

1.  **Clarify Ambiguous Requirements:**
    *   Several requirements are marked with asterisks (e.g., \"additional charge \*\*\*\*\*\* \", \"billing name \*\*\*\*\*\* \"). These need to be fully elaborated. What exactly is the functionality expected for these?
    *   \"Same like sale page\" for the purchase page is a good starting point, but it would be beneficial to explicitly list out the features that *are* identical and any that might differ, even slightly. This reduces assumptions.
    *   \"Colum add on hide(active or deactivate) on sale page\*\*\" and \"Colum hide এর option রাখতে হবে \" (Option to hide columns) are similar. Consolidate or clarify if there\'s a distinction.

2.  **Break Down Complex Features:**
    *   \"Search engine elastic search like (DIABETIC (ST)RIP (SA)FE TUCH (50) ## = sa 50 st show RESULT)\" is a significant feature. While the example is helpful, consider breaking down the expected behavior into more granular requirements:
        *   What fields should be searchable?
        *   What kind of fuzzy matching or partial word matching is expected?
        *   How should results be ranked?
        *   What is the expected performance?
    *   \"Item details (type/date/party/invoice/qty/price/cost/box/Pac/sale rate/status/user/discount/profit loss)+ every Colum filter(ranger equal less than greater then)\" is a very comprehensive requirement. It might be useful to specify which of these fields are critical for filtering and what the default display should be.

3.  **Prioritization:**
    *   The current list is extensive. While all features might be desired, it would be highly beneficial to categorize them by priority (e.g., Must-Have, Should-Have, Nice-to-Have). This helps in phased development and managing scope.

4.  **User Roles and Permissions:**
    *   Many features imply different user interactions (e.g., \"User wise report\", \"Item active inactive system\", \"Edit view history\"). It would be valuable to define user roles and their associated permissions explicitly. This impacts how UI elements are displayed and how backend access is controlled.

5.  **Data Sources and Integrations:**
    *   For features like \"WhatsApp Integration (Send Invoice)\", \"Elastic Search\", and \"Barcode Scan\", consider if there are specific third-party services or APIs you intend to use. Mentioning these early can streamline technical planning.

6.  **Consistency in Terminology:**
    *   Ensure consistent terminology throughout the document. For example, \"Sale page search on ever row\" and \"Search engine elastic search like...\" both refer to search but imply different mechanisms. Clarify if these are distinct or if one is a more advanced version of the other.
    *   \"Every tablet convert in excel and PDF with item details \*\*\" and \"Every table to Excel/PDF\" should be consistent.

7.  **Edge Cases and Error Handling:**
    *   You\'ve mentioned \"Negative Sale Warning\" and \"Zero Quantity Prohibition,\" which is great. Consider other edge cases:
        *   What happens if an item is out of stock?
        *   How are partial payments handled?
        *   What are the validation rules for various inputs?

8.  **Performance Expectations:**
    *   For features involving large datasets (e.g., reports, item lists with many details and filters), it\'s good to have some general performance expectations (e.g., \"page should load within X seconds,\" \"search results should appear instantly\").

By addressing these points, your requirements document will become even more robust and actionable for the development team.