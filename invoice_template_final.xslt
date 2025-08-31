<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

  <xsl:template match="/">
    <html>
      <head>
        <title>Invoice <xsl:value-of select="invoice/header/invoice_number"/></title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            margin: 0;
            padding: 20px;
            color: #000;
            background: white;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #000;
            background: white;
          }
          
          .header {
            padding: 8px 15px;
            border-bottom: 1px solid #000;
            position: relative;
            height: 60px;
          }
          
          .barcode {
            position: absolute;
            top: 3px;
            left: 15px;
            font-family: 'Courier New', monospace;
            font-size: 7px;
            letter-spacing: 0.5px;
          }
          
          .logo {
            position: absolute;
            top: 15px;
            left: 15px;
            width: 50px;
            height: 45px;
            background: linear-gradient(135deg, #e74c3c 0%, #f39c12 25%, #2ecc71 50%, #3498db 75%, #9b59b6 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .logo-inner {
            width: 25px;
            height: 25px;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .logo-center {
            width: 12px;
            height: 12px;
            background: linear-gradient(45deg, #3498db, #e74c3c);
            border-radius: 2px;
          }
          
          .invoice-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-top: 20px;
          }
          
          .invoice-number {
            position: absolute;
            top: 20px;
            right: 15px;
            font-size: 18px;
            font-weight: bold;
          }
          
          .company-section {
            display: flex;
            padding: 12px 15px;
            border-bottom: 1px solid #000;
          }
          
          .supplier-info {
            width: 50%;
            padding-right: 15px;
            font-size: 10px;
          }
          
          .customer-section {
            width: 50%;
            padding-left: 15px;
            font-size: 10px;
            border-left: 1px solid #000;
          }
          
          .company-name {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .address-line {
            margin-bottom: 1px;
          }
          
          .section-gap {
            margin-bottom: 6px;
          }
          
          .registration-text {
            font-size: 9px;
            margin-bottom: 6px;
            line-height: 1.2;
          }
          
          .payment-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 12px;
          }
          
          .payment-table td {
            padding: 2px 4px;
            border: 1px solid #ddd;
          }
          
          .payment-header {
            font-weight: bold;
            background: #f8f8f8;
          }
          
          .dates-section {
            padding: 8px 15px;
            border-bottom: 1px solid #000;
          }
          
          .dates-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          
          .dates-table td {
            padding: 2px 3px;
          }
          
          .dates-header {
            font-weight: bold;
            width: 15%;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          
          .items-table th {
            padding: 6px 3px;
            border: 1px solid #000;
            font-weight: bold;
            background: #f5f5f5;
          }
          
          .items-table td {
            padding: 4px 3px;
            border: 1px solid #000;
            vertical-align: top;
            line-height: 1.2;
          }
          
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          
          .col-description { width: 45%; font-size: 9px; }
          .col-qty { width: 6%; }
          .col-unit { width: 6%; }
          .col-price { width: 12%; }
          .col-total-excl { width: 12%; }
          .col-vat { width: 6%; }
          .col-total-incl { width: 13%; }
          
          .bottom-section {
            display: flex;
            min-height: 160px;
          }
          
          .footer-left {
            width: 50%;
            padding: 12px 15px;
            font-size: 9px;
          }
          
          .footer-right {
            width: 50%;
            padding: 12px 15px;
          }
          
          .signature-line {
            width: 160px;
            height: 1px;
            border-bottom: 1px solid #000;
            margin: 15px 0 8px 0;
          }
          
          .totals-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 10px;
            margin-left: auto;
          }
          
          .totals-table td {
            padding: 3px 6px;
            border: 1px solid #000;
          }
          
          .totals-header {
            font-weight: bold;
            background: #f8f8f8;
            width: 65%;
          }
          
          .totals-value {
            text-align: right;
            width: 35%;
          }
          
          .total-due-row {
            background: #d0d0d0;
          }
          
          .total-due-cell {
            padding: 4px 6px;
            font-weight: bold;
            font-size: 11px;
          }
          
          .large-total {
            text-align: center;
            margin-top: 12px;
            padding: 6px;
            background: #e8e8e8;
            font-weight: bold;
            font-size: 14px;
            border: 1px solid #ccc;
          }
          
          .amount-words {
            text-align: center;
            font-size: 8px;
            margin-top: 4px;
            font-style: italic;
            line-height: 1.2;
          }
          
          @media print {
            body { margin: 0; padding: 0; }
            .invoice-container { border: none; max-width: none; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="barcode">|||||||||||||||||||</div>
            <div class="logo">
              <div class="logo-inner">
                <div class="logo-center"></div>
              </div>
            </div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number"><xsl:value-of select="invoice/header/invoice_number"/></div>
          </div>
          
          <!-- Company Information -->
          <div class="company-section">
            <!-- Left side - Supplier -->
            <div class="supplier-info">
              <div class="company-name"><xsl:value-of select="invoice/supplier/company_name"/></div>
              <div class="address-line"><xsl:value-of select="invoice/supplier/address/street"/></div>
              <div class="address-line"><xsl:value-of select="invoice/supplier/address/postal_code"/><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/address/city"/></div>
              <div class="section-gap"><xsl:value-of select="invoice/supplier/address/country"/></div>
              
              <div class="registration-text section-gap">
                <xsl:value-of select="invoice/supplier/registration_info/text"/>
              </div>
              
              <div class="address-line"><strong>Company ID:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/company_id"/></div>
              <div class="address-line"><strong>VAT ID:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/vat_id"/></div>
              <div class="section-gap"><xsl:value-of select="invoice/supplier/vat_payer"/></div>
              
              <div class="address-line"><strong>EMAIL:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/contact/email"/></div>
              <div class="section-gap"><strong>WEBSITE:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/contact/website"/></div>
              
              <div class="address-line"><strong>IBAN:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/bank_details/iban"/></div>
              <div class="address-line"><strong>SWIFT:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/bank_details/swift"/></div>
              <div class="address-line"><strong>BANK:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/bank_details/bank"/></div>
              <div class="address-line"><strong>ACCOUNT NO.:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/supplier/bank_details/account_no"/></div>
            </div>
            
            <!-- Right side - Customer -->
            <div class="customer-section">
              <table class="payment-table">
                <tr>
                  <td class="payment-header">Payment type:</td>
                  <td>bank transfer</td>
                  <td class="payment-header">Payment symbol:</td>
                  <td><xsl:value-of select="invoice/payment_info/payment_symbol"/></td>
                </tr>
              </table>
              
              <div>
                <div style="font-weight: bold; margin-bottom: 3px;">Purchaser</div>
                <div class="company-name"><xsl:value-of select="invoice/customer/company_name"/></div>
                <div class="address-line"><xsl:value-of select="invoice/customer/address/street"/></div>
                <div class="address-line"><xsl:value-of select="invoice/customer/address/postal_code"/><xsl:text> </xsl:text><xsl:value-of select="invoice/customer/address/city"/></div>
                <div class="section-gap"><xsl:value-of select="invoice/customer/address/country"/></div>
                
                <div class="address-line"><strong>Company ID:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/customer/company_id"/></div>
                <div class="address-line"><strong>VAT ID:</strong><xsl:text> </xsl:text><xsl:value-of select="invoice/customer/vat_id"/></div>
              </div>
            </div>
          </div>
          
          <!-- Date Information -->
          <div class="dates-section">
            <table class="dates-table">
              <tr>
                <td class="dates-header">Issue date</td>
                <td class="dates-header">Delivery date</td>
                <td class="dates-header">Due date</td>
                <td style="width: 55%;"></td>
              </tr>
              <tr>
                <td><xsl:value-of select="invoice/header/issue_date"/></td>
                <td><xsl:value-of select="invoice/header/delivery_date"/></td>
                <td><xsl:value-of select="invoice/header/due_date"/></td>
                <td></td>
              </tr>
            </table>
          </div>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="text-left col-description">Item description</th>
                <th class="text-center col-qty">QTY</th>
                <th class="text-center col-unit">Unit</th>
                <th class="text-right col-price">Price per unit</th>
                <th class="text-right col-total-excl">Total excl. VAT</th>
                <th class="text-center col-vat">VAT</th>
                <th class="text-right col-total-incl">Total incl. VAT</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="invoice/items/item">
                <tr>
                  <td class="text-left col-description"><xsl:value-of select="description"/></td>
                  <td class="text-center"><xsl:value-of select="quantity"/></td>
                  <td class="text-center"><xsl:value-of select="unit"/></td>
                  <td class="text-right"><xsl:value-of select="format-number(price_per_unit, '0.00')"/></td>
                  <td class="text-right"><xsl:value-of select="format-number(total_excl_vat, '0.00')"/></td>
                  <td class="text-center"><xsl:value-of select="vat_rate"/>%</td>
                  <td class="text-right"><xsl:value-of select="format-number(total_incl_vat, '0.00')"/></td>
                </tr>
              </xsl:for-each>
              <tr>
                <td colspan="6" class="text-right" style="font-weight: bold; padding: 5px 3px;">Total:</td>
                <td class="text-right" style="font-weight: bold; padding: 5px 3px;"><xsl:value-of select="format-number(invoice/totals/subtotal, '0.00')"/></td>
              </tr>
            </tbody>
          </table>
          
          <!-- Bottom section -->
          <div class="bottom-section">
            <!-- Left side - Footer info -->
            <div class="footer-left">
              <div style="margin-bottom: 12px;">
                <strong>* VAT reverse charge. Tax is paid by the customer.</strong>
              </div>
              <div style="margin-bottom: 8px;">
                <strong>Issued by:</strong>
              </div>
              <div class="signature-line"></div>
              <div style="font-weight: bold;">
                <xsl:value-of select="invoice/issued_by/name"/>
              </div>
            </div>
            
            <!-- Right side - Totals -->
            <div class="footer-right">
              <table class="totals-table">
                <tr>
                  <td class="totals-header">Received by:</td>
                  <td class="totals-value"></td>
                </tr>
                <tr>
                  <td class="totals-header">Discount:</td>
                  <td class="totals-value"><xsl:value-of select="invoice/totals/discount_percent"/>%</td>
                </tr>
                <tr>
                  <td class="totals-header">Total amount excl. VAT:</td>
                  <td class="totals-value"><xsl:value-of select="format-number(invoice/totals/total_amount_excl_vat, '0.00')"/><xsl:text> </xsl:text><xsl:value-of select="invoice/totals/currency"/></td>
                </tr>
                <tr>
                  <td class="totals-header">VAT*:</td>
                  <td class="totals-value"><xsl:value-of select="format-number(invoice/totals/vat_total, '0.00')"/><xsl:text> </xsl:text><xsl:value-of select="invoice/totals/currency"/></td>
                </tr>
                <tr>
                  <td class="totals-header">Total amount incl. VAT:</td>
                  <td class="totals-value"><xsl:value-of select="format-number(invoice/totals/total_amount_incl_vat, '0.00')"/><xsl:text> </xsl:text><xsl:value-of select="invoice/totals/currency"/></td>
                </tr>
                <tr>
                  <td class="totals-header">Advance paid:</td>
                  <td class="totals-value"><xsl:value-of select="format-number(invoice/totals/advance_paid, '0.00')"/><xsl:text> </xsl:text><xsl:value-of select="invoice/totals/currency"/></td>
                </tr>
                <tr class="total-due-row">
                  <td class="total-due-cell">Total due:</td>
                  <td class="total-due-cell totals-value"><xsl:value-of select="format-number(invoice/totals/total_due, '0.00')"/><xsl:text> </xsl:text><xsl:value-of select="invoice/totals/currency"/></td>
                </tr>
              </table>
              
              <!-- Large total amount -->
              <div class="large-total">
                <xsl:value-of select="format-number(invoice/totals/total_due, '0.00')"/><xsl:text> </xsl:text><xsl:value-of select="invoice/totals/currency"/>
              </div>
              <div class="amount-words">
                <xsl:value-of select="invoice/totals/amount_in_words"/>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
