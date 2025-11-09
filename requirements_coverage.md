# Requirements Coverage Mapping

This document maps the requirements to the current implementation status in the codebase. It helps track which features are implemented, partially implemented, or pending.

## Sales Page

| Requirement | Implemented In | Status |
|---|---|---|
| Column Visibility Toggle | `components/sales/ItemsTable.tsx` | Implemented |
| Due Date Display | `components/sales/NewSaleForm.tsx` | Implemented |
| Preview Before Save | `components/sales/NewSaleForm.tsx` | Implemented |
| Zero Quantity Prohibition | `components/sales/ItemsTable.tsx` | Implemented |
| Round Off Total | `components/sales/NewSaleForm.tsx` | Implemented |
| Transaction Wise Discount | `components/sales/NewSaleForm.tsx` | Implemented |
| Rate Update | `components/sales/ItemsTable.tsx` | Partially Implemented |
| Column Hide Option | `components/sales/SalesList.tsx` | Implemented |
| Total Bottom Panel Adjustment | `components/sales/NewSaleForm.tsx` | Implemented |
| Category Filter | `components/sales/ItemsTable.tsx` | Implemented |
| Unit Change | `components/sales/ItemsTable.tsx` | Implemented |
| Watermark | `app/sales/page.tsx` | Implemented |
| WhatsApp Integration | `components/sales/SalesList.tsx` | Implemented |

## Purchase Page

| Requirement | Implemented In | Status |
|---|---|---|
| Same as Sale Page Features | `components/purchases/PurchasesList.tsx` | Partially Implemented |

## Invoices

| Requirement | Implemented In | Status |
|---|---|---|
| Column Visibility Toggle | `components/invoices/InvoiceList.tsx` | Implemented |
| Status Badge | `components/invoices/InvoiceList.tsx` | Implemented |

## General Features

| Requirement | Implemented In | Status |
|---|---|---|
| Color-coded Transaction Status | `components/sales/SalesList.tsx`, `components/invoices/InvoiceList.tsx`, `components/purchases/PurchasesList.tsx` | Implemented |
| Additional Charge Dilution | `components/sales/ItemsTable.tsx`, `components/sales/NewSaleForm.tsx` | Implemented |
