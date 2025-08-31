<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Invoice <xsl:value-of select="invoice/header/invoice_number"/></title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
            color: #000;
            background: white;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #000;
            background: white;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            border-bottom: 1px solid #000;
            background: white;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
          }
          
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            margin-right: 15px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          
          .logo::before {
            content: "";
            position: absolute;
            width: 30px;
            height: 30px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
          }
          
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #000;
          }
          
          .company-info {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            border-bottom: 1px solid #000;
          }
          
          .supplier-info, .customer-info {
            width: 48%;
          }
          
          .supplier-info h3, .customer-info h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: bold;
          }
          
          .supplier-info p, .customer-info p {
            margin: 2px 0;
            line-height: 1.3;
          }
          
          .payment-section {
            display: flex;
            justify-content: space-between;
            padding: 15px 20px;
            border-bottom: 1px solid #000;
            background: #f8f8f8;
          }
          
          .payment-info, .dates-info {
            width: 48%;
          }
          
          .payment-info table, .dates-info table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .payment-info td, .dates-info td {
            padding: 3px 5px;
            font-size: 11px;
          }
          
          .payment-info td:first-child, .dates-info td:first-child {
            font-weight: bold;
            width: 40%;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
          }
          
          .items-table th {
            background: #e0e0e0;
            padding: 8px 5px;
            border: 1px solid #000;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
          }
          
          .items-table td {
            padding: 6px 5px;
            border: 1px solid #000;
            font-size: 11px;
            vertical-align: top;
          }
          
          .items-table .description {
            text-align: left;
            max-width: 300px;
          }
          
          .items-table .number {
            text-align: right;
          }
          
          .items-table .center {
            text-align: center;
          }
          
          .totals-section {
            display: flex;
            justify-content: flex-end;
            padding: 20px;
          }
          
          .totals-table {
            border-collapse: collapse;
            width: 300px;
          }
          
          .totals-table td {
            padding: 5px 10px;
            border: 1px solid #000;
            font-size: 12px;
          }
          
          .totals-table td:first-child {
            font-weight: bold;
            background: #f0f0f0;
            width: 60%;
          }
          
          .totals-table td:last-child {
            text-align: right;
            width: 40%;
          }
          
          .total-due {
            background: #d0d0d0 !important;
            font-weight: bold;
            font-size: 14px;
          }
          
          .footer {
            padding: 20px;
            border-top: 1px solid #000;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .notes {
            font-size: 10px;
            flex: 1;
          }
          
          .signature-section {
            text-align: center;
          }
          
          .signature-section p {
            margin: 5px 0;
            font-size: 11px;
          }
          
          .signature-line {
            width: 150px;
            height: 40px;
            border-bottom: 1px solid #000;
            margin: 10px 0;
          }
          
          @media print {
            body { margin: 0; padding: 0; }
            .invoice-container { border: none; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <div class="logo"></div>
            </div>
            <div class="invoice-title">
              INVOICE <xsl:value-of select="invoice/header/invoice_number"/>
            </div>
          </div>
          
          <!-- Company Information -->
          <div class="company-info">
            <div class="supplier-info">
              <h3><xsl:value-of select="invoice/supplier/company_name"/></h3>
              <p><xsl:value-of select="invoice/supplier/address/street"/></p>
              <p><xsl:value-of select="invoice/supplier/address/postal_code"/> <xsl:value-of select="invoice/supplier/address/city"/></p>
              <p><xsl:value-of select="invoice/supplier/address/country"/></p>
              <br/>
              <p><xsl:value-of select="invoice/supplier/registration_info/text"/></p>
              <br/>
              <p><strong>Company ID:</strong> <xsl:value-of select="invoice/supplier/company_id"/></p>
              <p><strong>VAT ID:</strong> <xsl:value-of select="invoice/supplier/vat_id"/></p>
              <p><xsl:value-of select="invoice/supplier/vat_payer"/></p>
              <br/>
              <p><strong>EMAIL:</strong> <xsl:value-of select="invoice/supplier/contact/email"/></p>
              <p><strong>WEBSITE:</strong> <xsl:value-of select="invoice/supplier/contact/website"/></p>
              <br/>
              <p><strong>IBAN:</strong> <xsl:value-of select="invoice/supplier/bank_details/iban"/></p>
              <p><strong>SWIFT:</strong> <xsl:value-of select="invoice/supplier/bank_details/swift"/></p>
              <p><strong>BANK:</strong> <xsl:value-of select="invoice/supplier/bank_details/bank"/></p>
              <p><strong>ACCOUNT NO.:</strong> <xsl:value-of select="invoice/supplier/bank_details/account_no"/></p>
            </div>
            
            <div class="customer-info">
              <h3>Purchaser</h3>
              <p><strong><xsl:value-of select="invoice/customer/company_name"/></strong></p>
              <p><xsl:value-of select="invoice/customer/address/street"/></p>
              <p><xsl:value-of select="invoice/customer/address/postal_code"/> <xsl:value-of select="invoice/customer/address/city"/></p>
              <p><xsl:value-of select="invoice/customer/address/country"/></p>
              <br/>
              <p><strong>Company ID:</strong> <xsl:value-of select="invoice/customer/company_id"/></p>
              <p><strong>VAT ID:</strong> <xsl:value-of select="invoice/customer/vat_id"/></p>
            </div>
          </div>
          
          <!-- Payment and Date Information -->
          <div class="payment-section">
            <div class="payment-info">
              <table>
                <tr>
                  <td>Payment type:</td>
                  <td><xsl:value-of select="invoice/payment_info/payment_type"/></td>
                </tr>
                <tr>
                  <td>Payment symbol:</td>
                  <td><xsl:value-of select="invoice/payment_info/payment_symbol"/></td>
                </tr>
              </table>
            </div>
            <div class="dates-info">
              <table>
                <tr>
                  <td>Issue date</td>
                  <td>Delivery date</td>
                  <td>Due date</td>
                </tr>
                <tr>
                  <td><xsl:value-of select="invoice/header/issue_date"/></td>
                  <td><xsl:value-of select="invoice/header/delivery_date"/></td>
                  <td><xsl:value-of select="invoice/header/due_date"/></td>
                </tr>
              </table>
            </div>
          </div>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Item description</th>
                <th>QTY</th>
                <th>Unit</th>
                <th>Price per unit</th>
                <th>Total excl. VAT</th>
                <th>VAT</th>
                <th>Total incl. VAT</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="invoice/items/item">
                <tr>
                  <td class="description"><xsl:value-of select="description"/></td>
                  <td class="center"><xsl:value-of select="quantity"/></td>
                  <td class="center"><xsl:value-of select="unit"/></td>
                  <td class="number"><xsl:value-of select="format-number(price_per_unit, '#,##0.00')"/></td>
                  <td class="number"><xsl:value-of select="format-number(total_excl_vat, '#,##0.00')"/></td>
                  <td class="center"><xsl:value-of select="vat_rate"/>%</td>
                  <td class="number"><xsl:value-of select="format-number(total_incl_vat, '#,##0.00')"/></td>
                </tr>
              </xsl:for-each>
              <tr>
                <td colspan="6" style="text-align: right; font-weight: bold;">Total:</td>
                <td class="number" style="font-weight: bold;"><xsl:value-of select="format-number(invoice/totals/subtotal, '#,##0.00')"/></td>
              </tr>
            </tbody>
          </table>
          
          <!-- Totals -->
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td>Received by:</td>
                <td></td>
              </tr>
              <tr>
                <td>Discount:</td>
                <td><xsl:value-of select="invoice/totals/discount_percent"/>%</td>
              </tr>
              <tr>
                <td>Total amount excl. VAT:</td>
                <td><xsl:value-of select="format-number(invoice/totals/total_amount_excl_vat, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></td>
              </tr>
              <tr>
                <td>VAT*:</td>
                <td><xsl:value-of select="format-number(invoice/totals/vat_total, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></td>
              </tr>
              <tr>
                <td>Total amount incl. VAT:</td>
                <td><xsl:value-of select="format-number(invoice/totals/total_amount_incl_vat, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></td>
              </tr>
              <tr>
                <td>Advance paid:</td>
                <td><xsl:value-of select="format-number(invoice/totals/advance_paid, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></td>
              </tr>
              <tr class="total-due">
                <td>Total due:</td>
                <td><xsl:value-of select="format-number(invoice/totals/total_due, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></td>
              </tr>
            </table>
          </div>
          
          <!-- Footer with Notes and Signature -->
          <div class="footer">
            <div class="notes">
              <p><xsl:value-of select="invoice/notes/vat_note"/></p>
              <br/>
              <p><strong>Issued by:</strong></p>
              <div class="signature-line"></div>
              <p><xsl:value-of select="invoice/issued_by/name"/></p>
            </div>
            <div class="signature-section">
              <p><strong>Discount:</strong></p>
              <p><xsl:value-of select="invoice/totals/discount_percent"/>%</p>
              <br/>
              <p><strong>Total amount excl. VAT:</strong></p>
              <p><xsl:value-of select="format-number(invoice/totals/total_amount_excl_vat, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></p>
              <br/>
              <p><strong>Total amount incl. VAT:</strong></p>
              <p><xsl:value-of select="format-number(invoice/totals/total_amount_incl_vat, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></p>
              <br/>
              <p><strong>Advance paid:</strong></p>
              <p><xsl:value-of select="format-number(invoice/totals/advance_paid, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/></p>
              <br/>
              <p style="font-size: 14px; font-weight: bold; background: #d0d0d0; padding: 5px;">
                <xsl:value-of select="format-number(invoice/totals/total_due, '#,##0.00')"/> <xsl:value-of select="invoice/totals/currency"/>
              </p>
              <p style="font-size: 10px; margin-top: 5px;">
                <xsl:value-of select="invoice/totals/amount_in_words"/>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
