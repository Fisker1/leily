/**
 * Template rendering utility for Leily email system
 * Handles rendering HTML templates with dynamic data
 */

export interface EmailTemplateData {
  name: string;
  email: string;
  [key: string]: any;
}

export interface RenderedEmail {
  html: string;
  subject: string;
}

/**
 * Get account created email template with beautiful gradient design
 */
function getAccountCreatedTemplate(): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velkommen til Leily</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e0f7fa 0%, #bbdefb 50%, #c8e6c9 100%);
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo-placeholder {
      width: 200px;
      height: 60px;
      background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 50%, #26c6da 100%);
      border-radius: 8px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: #1a202c;
      text-align: center;
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #2d3748;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
    }
    .features {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .features h3 {
      color: #2d3748;
      margin-top: 0;
    }
    .features ul {
      margin: 0;
      padding-left: 20px;
    }
    .features li {
      margin-bottom: 10px;
      color: #4a5568;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .footer {
      background-color: #2d3748;
      color: #a0aec0;
      padding: 30px;
      text-align: center;
      border-radius: 0 0 8px 8px;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer a {
      color: #63b3ed;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #a0aec0;
      text-decoration: none;
      font-size: 14px;
    }
    .social-links a:hover {
      color: #63b3ed;
    }
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 15px;
      }
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 28px;
      }
      .button {
        padding: 14px 28px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with gradient background -->
    <div class="header">
      <div class="logo-placeholder">
        LEILY
      </div>
      <p style="color: #2d3748; font-size: 16px; margin: 0;">Din pålitelige partner for eiendomsforvaltning</p>
    </div>

    <!-- Main content -->
    <div class="content">
      <h1 class="title">Velkommen til Leily! 🏠</h1>
      
      <p class="greeting">Hei {{name}},</p>
      
      <p class="message">
        Takk for at du opprettet en konto hos Leily! Vi er glade for å ha deg med i vår familie av eiendomsforvaltere og leietakere.
      </p>

      <div class="features">
        <h3>Hva kan du gjøre med din Leily-konto?</h3>
        <ul>
          <li>📋 Opprette og administrere leieavtaler</li>
          <li>💰 Spore leiebetalinger og innbetalinger</li>
          <li>📊 Få oversikt over din eiendomsportefølje</li>
          <li>📱 Få påminnelser og varsler på e-post</li>
          <li>🔐 Sikker lagring av alle dine dokumenter</li>
        </ul>
      </div>

      <div class="button-container">
        <a href="https://leily.no/dashboard" class="button">GÅ TIL DASHBOARD</a>
      </div>

      <p style="color: #4a5568; font-size: 14px; margin-top: 30px;">
        Trenger du hjelp med å komme i gang? Kontakt oss på <a href="mailto:kontakt@leily.no" style="color: #667eea;">kontakt@leily.no</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-links">
        <a href="https://leily.no">Besøk oss</a>
        <a href="https://leily.no/privacy">Personvern</a>
        <a href="https://leily.no/terms">Vilkår</a>
      </div>
      
      <p><strong>Leily AS</strong></p>
      <p>Din pålitelige partner for eiendomsforvaltning</p>
      <p>E-post: <a href="mailto:kontakt@leily.no">kontakt@leily.no</a></p>
      <p>Nettside: <a href="https://leily.no">leily.no</a></p>
      
      <p style="margin-top: 20px; font-size: 12px; color: #718096;">
        © 2025 Leily AS. Alle rettigheter forbeholdt.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get lease ready email template with beautiful gradient design
 */
function getLeaseReadyTemplate(): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leieavtale klar for signering - Leily</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e0f7fa 0%, #bbdefb 50%, #c8e6c9 100%);
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo-placeholder {
      width: 200px;
      height: 60px;
      background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 50%, #26c6da 100%);
      border-radius: 8px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: #1a202c;
      text-align: center;
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #2d3748;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
    }
    .lease-details {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .lease-details h3 {
      color: #2d3748;
      margin-top: 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 5px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #4a5568;
    }
    .detail-value {
      color: #2d3748;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .warning {
      background-color: #fff5f5;
      border-left: 4px solid #f56565;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-text {
      color: #c53030;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background-color: #2d3748;
      color: #a0aec0;
      padding: 30px;
      text-align: center;
      border-radius: 0 0 8px 8px;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer a {
      color: #63b3ed;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #a0aec0;
      text-decoration: none;
      font-size: 14px;
    }
    .social-links a:hover {
      color: #63b3ed;
    }
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 15px;
      }
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 28px;
      }
      .button {
        padding: 14px 28px;
        font-size: 16px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-value {
        margin-top: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with gradient background -->
    <div class="header">
      <div class="logo-placeholder">
        LEILY
      </div>
      <p style="color: #2d3748; font-size: 16px; margin: 0;">Din pålitelige partner for eiendomsforvaltning</p>
    </div>

    <!-- Main content -->
    <div class="content">
      <h1 class="title">Leieavtale klar for signering 📋</h1>
      
      <p class="greeting">Hei {{name}},</p>
      
      <p class="message">
        Din leieavtale er nå klar for signering! Klikk på knappen nedenfor for å lese gjennom og signere avtalen digitalt.
      </p>

      <div class="lease-details">
        <h3>Leieavtale detaljer</h3>
        <div class="detail-row">
          <span class="detail-label">Eiendom:</span>
          <span class="detail-value">{{property_address}}, {{property_city}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Månedlig leie:</span>
          <span class="detail-value">{{monthly_rent}} kr</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Depositum:</span>
          <span class="detail-value">{{deposit_amount}} kr</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Leieperiode:</span>
          <span class="detail-value">{{lease_start_date}} - {{lease_end_date}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Utleier:</span>
          <span class="detail-value">{{landlord_name}}</span>
        </div>
      </div>

      <div class="button-container">
        <a href="{{signing_url}}" class="button">SIGNER LEIEAVTALE</a>
      </div>

      <div class="warning">
        <p class="warning-text">
          <strong>Viktig:</strong> Du har 7 dager på deg til å signere leieavtalen. 
          Etter denne perioden vil avtalen utløpe og du må be om en ny.
        </p>
      </div>

      <p style="color: #4a5568; font-size: 14px; margin-top: 30px;">
        Spørsmål om leieavtalen? Kontakt oss på <a href="mailto:kontakt@leily.no" style="color: #667eea;">kontakt@leily.no</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-links">
        <a href="https://leily.no">Besøk oss</a>
        <a href="https://leily.no/privacy">Personvern</a>
        <a href="https://leily.no/terms">Vilkår</a>
      </div>
      
      <p><strong>Leily AS</strong></p>
      <p>Din pålitelige partner for eiendomsforvaltning</p>
      <p>E-post: <a href="mailto:kontakt@leily.no">kontakt@leily.no</a></p>
      <p>Nettside: <a href="https://leily.no">leily.no</a></p>
      
      <p style="margin-top: 20px; font-size: 12px; color: #718096;">
        © 2025 Leily AS. Alle rettigheter forbeholdt.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get lease signed confirmation email template with beautiful gradient design
 */
function getLeaseSignedTemplate(): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leieavtale signert - Leily</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e0f7fa 0%, #bbdefb 50%, #c8e6c9 100%);
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo-placeholder {
      width: 200px;
      height: 60px;
      background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 50%, #26c6da 100%);
      border-radius: 8px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: #1a202c;
      text-align: center;
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #2d3748;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
    }
    .success-box {
      background-color: #f0fff4;
      border: 2px solid #68d391;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .success-box h3 {
      color: #22543d;
      margin-top: 0;
      font-size: 24px;
    }
    .success-box p {
      color: #2f855a;
      margin: 0;
      font-size: 16px;
    }
    .lease-details {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #68d391;
    }
    .lease-details h3 {
      color: #2d3748;
      margin-top: 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 5px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #4a5568;
    }
    .detail-value {
      color: #2d3748;
    }
    .next-steps {
      background-color: #edf2f7;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .next-steps h3 {
      color: #2d3748;
      margin-top: 0;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin-bottom: 10px;
      color: #4a5568;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #68d391 0%, #48bb78 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 15px rgba(104, 211, 145, 0.4);
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(104, 211, 145, 0.6);
    }
    .footer {
      background-color: #2d3748;
      color: #a0aec0;
      padding: 30px;
      text-align: center;
      border-radius: 0 0 8px 8px;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer a {
      color: #63b3ed;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #a0aec0;
      text-decoration: none;
      font-size: 14px;
    }
    .social-links a:hover {
      color: #63b3ed;
    }
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 15px;
      }
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 28px;
      }
      .button {
        padding: 14px 28px;
        font-size: 16px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-value {
        margin-top: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with gradient background -->
    <div class="header">
      <div class="logo-placeholder">
        LEILY
      </div>
      <p style="color: #2d3748; font-size: 16px; margin: 0;">Din pålitelige partner for eiendomsforvaltning</p>
    </div>

    <!-- Main content -->
    <div class="content">
      <h1 class="title">Leieavtale signert! ✅</h1>
      
      <p class="greeting">Hei {{name}},</p>
      
      <div class="success-box">
        <h3>🎉 Gratulerer!</h3>
        <p>Din leieavtale har blitt signert og er nå gyldig. Du kan nå flytte inn i din nye bolig!</p>
      </div>

      <p class="message">
        Takk for at du valgte Leily for din leieavtale. Vi har mottatt din signatur og avtalen er nå offisielt i kraft.
      </p>

      <div class="lease-details">
        <h3>Signert leieavtale</h3>
        <div class="detail-row">
          <span class="detail-label">Eiendom:</span>
          <span class="detail-value">{{property_address}}, {{property_city}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Månedlig leie:</span>
          <span class="detail-value">{{monthly_rent}} kr</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Leieperiode:</span>
          <span class="detail-value">{{lease_start_date}} - {{lease_end_date}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Utleier:</span>
          <span class="detail-value">{{landlord_name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Signert:</span>
          <span class="detail-value">{{current_date}}</span>
        </div>
      </div>

      <div class="next-steps">
        <h3>Neste steg</h3>
        <ul>
          <li>📋 Last ned en kopi av den signerte leieavtalen</li>
          <li>🔑 Kontakt utleier for å få nøkler til boligen</li>
          <li>📅 Planlegg flyttedatoen din</li>
          <li>💰 Sett opp automatisk betaling for leie</li>
          <li>📱 Last ned Leily-appen for enkel administrasjon</li>
        </ul>
      </div>

      <div class="button-container">
        <a href="https://leily.no/dashboard" class="button">GÅ TIL DASHBOARD</a>
      </div>

      <p style="color: #4a5568; font-size: 14px; margin-top: 30px;">
        Spørsmål om leieavtalen? Kontakt oss på <a href="mailto:kontakt@leily.no" style="color: #667eea;">kontakt@leily.no</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-links">
        <a href="https://leily.no">Besøk oss</a>
        <a href="https://leily.no/privacy">Personvern</a>
        <a href="https://leily.no/terms">Vilkår</a>
      </div>
      
      <p><strong>Leily AS</strong></p>
      <p>Din pålitelige partner for eiendomsforvaltning</p>
      <p>E-post: <a href="mailto:kontakt@leily.no">kontakt@leily.no</a></p>
      <p>Nettside: <a href="https://leily.no">leily.no</a></p>
      
      <p style="margin-top: 20px; font-size: 12px; color: #718096;">
        © 2025 Leily AS. Alle rettigheter forbeholdt.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get account deleted email template with beautiful gradient design
 */
function getAccountDeletedTemplate(): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konto avsluttet - Leily</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e0f7fa 0%, #bbdefb 50%, #c8e6c9 100%);
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo-placeholder {
      width: 200px;
      height: 60px;
      background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 50%, #26c6da 100%);
      border-radius: 8px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: #1a202c;
      text-align: center;
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #2d3748;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
    }
    .confirmation-box {
      background-color: #fef5e7;
      border: 2px solid #f6ad55;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .confirmation-box h3 {
      color: #c05621;
      margin-top: 0;
      font-size: 24px;
    }
    .confirmation-box p {
      color: #9c4221;
      margin: 0;
      font-size: 16px;
    }
    .important-info {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #f6ad55;
    }
    .important-info h3 {
      color: #2d3748;
      margin-top: 0;
    }
    .important-info ul {
      margin: 0;
      padding-left: 20px;
    }
    .important-info li {
      margin-bottom: 10px;
      color: #4a5568;
    }
    .feedback-section {
      background-color: #edf2f7;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .feedback-section h3 {
      color: #2d3748;
      margin-top: 0;
    }
    .feedback-section p {
      color: #4a5568;
      margin-bottom: 15px;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 15px rgba(246, 173, 85, 0.4);
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(246, 173, 85, 0.6);
    }
    .footer {
      background-color: #2d3748;
      color: #a0aec0;
      padding: 30px;
      text-align: center;
      border-radius: 0 0 8px 8px;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer a {
      color: #63b3ed;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #a0aec0;
      text-decoration: none;
      font-size: 14px;
    }
    .social-links a:hover {
      color: #63b3ed;
    }
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 15px;
      }
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 28px;
      }
      .button {
        padding: 14px 28px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with gradient background -->
    <div class="header">
      <div class="logo-placeholder">
        LEILY
      </div>
      <p style="color: #2d3748; font-size: 16px; margin: 0;">Din pålitelige partner for eiendomsforvaltning</p>
    </div>

    <!-- Main content -->
    <div class="content">
      <h1 class="title">Konto avsluttet 👋</h1>
      
      <p class="greeting">Hei {{name}},</p>
      
      <div class="confirmation-box">
        <h3>📧 Bekreftelse</h3>
        <p>Din Leily-konto har blitt avsluttet som ønsket. Vi bekrefter at alle dine personopplysninger er slettet fra våre systemer.</p>
      </div>

      <p class="message">
        Vi beklager å se deg gå, men respekterer ditt valg. Din konto og alle tilhørende data har blitt permanent slettet i henhold til våre personvernretningslinjer.
      </p>

      <div class="important-info">
        <h3>Viktig informasjon</h3>
        <ul>
          <li>✅ Alle dine personopplysninger er slettet</li>
          <li>✅ Alle leieavtaler og dokumenter er fjernet</li>
          <li>✅ Ingen ytterligere e-poster vil bli sendt</li>
          <li>✅ Kontoen kan ikke gjenopprettes</li>
        </ul>
      </div>

      <div class="feedback-section">
        <h3>Hjelp oss å bli bedre</h3>
        <p>Hvis du har noen tilbakemelding om din opplevelse med Leily, setter vi stor pris på å høre fra deg. Dine meninger hjelper oss å forbedre tjenesten vår.</p>
        <div class="button-container">
          <a href="mailto:kontakt@leily.no?subject=Tilbakemelding%20etter%20kontoavslutning" class="button">GI TILBAKEMELDING</a>
        </div>
      </div>

      <p style="color: #4a5568; font-size: 14px; margin-top: 30px;">
        Hvis du endrer mening, kan du alltid opprette en ny konto på <a href="https://leily.no" style="color: #667eea;">leily.no</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-links">
        <a href="https://leily.no">Besøk oss</a>
        <a href="https://leily.no/privacy">Personvern</a>
        <a href="https://leily.no/terms">Vilkår</a>
      </div>
      
      <p><strong>Leily AS</strong></p>
      <p>Din pålitelige partner for eiendomsforvaltning</p>
      <p>E-post: <a href="mailto:kontakt@leily.no">kontakt@leily.no</a></p>
      <p>Nettside: <a href="https://leily.no">leily.no</a></p>
      
      <p style="margin-top: 20px; font-size: 12px; color: #718096;">
        © 2025 Leily AS. Alle rettigheter forbeholdt.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get password reset email template with beautiful gradient design
 */
function getPasswordResetTemplate(): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tilbakestill passord - Leily</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #e0f7fa 0%, #bbdefb 50%, #c8e6c9 100%);
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo {
      max-width: 200px;
      height: auto;
      margin-bottom: 20px;
    }
    .logo-placeholder {
      width: 200px;
      height: 60px;
      background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 50%, #26c6da 100%);
      border-radius: 8px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      color: #1a202c;
      text-align: center;
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #2d3748;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
    }
    .steps {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
    }
    .steps li {
      margin-bottom: 10px;
      color: #4a5568;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .warning {
      background-color: #fff5f5;
      border-left: 4px solid #f56565;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-text {
      color: #c53030;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background-color: #2d3748;
      color: #a0aec0;
      padding: 30px;
      text-align: center;
      border-radius: 0 0 8px 8px;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer a {
      color: #63b3ed;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #a0aec0;
      text-decoration: none;
      font-size: 14px;
    }
    .social-links a:hover {
      color: #63b3ed;
    }
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 15px;
      }
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 28px;
      }
      .button {
        padding: 14px 28px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with gradient background -->
    <div class="header">
      <div class="logo-placeholder">
        LEILY
      </div>
      <p style="color: #2d3748; font-size: 16px; margin: 0;">Din pålitelige partner for eiendomsforvaltning</p>
    </div>

    <!-- Main content -->
    <div class="content">
      <h1 class="title">Tilbakestill passord</h1>
      
      <p class="greeting">Hei {{name}},</p>
      
      <p class="message">
        Du har bedt om å tilbakestille passordet ditt for Leily-kontoen din. 
        Følg de enkle stegene nedenfor for å opprette et nytt passord:
      </p>

      <div class="steps">
        <ol>
          <li>Klikk på "TILBAKESTILL PASSORD" knappen nedenfor</li>
          <li>Skriv inn et nytt, sterkt passord</li>
          <li>Bekreft det nye passordet</li>
          <li>Klikk "Lagre" for å fullføre</li>
        </ol>
      </div>

      <div class="button-container">
        <a href="{{reset_link}}" class="button">TILBAKESTILL PASSORD</a>
      </div>

      <div class="warning">
        <p class="warning-text">
          <strong>Viktig:</strong> Denne lenken er kun gyldig i 2 timer og kan kun brukes én gang. 
          Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.
        </p>
      </div>

      <p style="color: #4a5568; font-size: 14px; margin-top: 30px;">
        Trenger du hjelp? Kontakt oss på <a href="mailto:kontakt@leily.no" style="color: #667eea;">kontakt@leily.no</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-links">
        <a href="https://leily.no">Besøk oss</a>
        <a href="https://leily.no/privacy">Personvern</a>
        <a href="https://leily.no/terms">Vilkår</a>
      </div>
      
      <p><strong>Leily AS</strong></p>
      <p>Din pålitelige partner for eiendomsforvaltning</p>
      <p>E-post: <a href="mailto:kontakt@leily.no">kontakt@leily.no</a></p>
      <p>Nettside: <a href="https://leily.no">leily.no</a></p>
      
      <p style="margin-top: 20px; font-size: 12px; color: #718096;">
        © 2025 Leily AS. Alle rettigheter forbeholdt.
      </p>
      
      <p style="font-size: 12px; color: #718096;">
        <a href="https://leily.no/unsubscribe" style="color: #a0aec0;">Avmeld deg fra våre e-poster</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders an email template with the provided data
 * @param emailType - Type of email template to render
 * @param data - Data to replace placeholders in template
 * @returns Rendered email HTML and subject
 */
export async function renderTemplate(
  emailType: string,
  data: EmailTemplateData
): Promise<RenderedEmail> {
  try {
    // Get template based on email type
    let templateHtml: string;
    let subject: string;
    
    switch (emailType) {
      case 'account_created':
        templateHtml = getAccountCreatedTemplate();
        subject = `Velkommen til Leily, ${data.name}! 🏠`;
        break;
      case 'password_reset':
        templateHtml = getPasswordResetTemplate();
        subject = `Tilbakestill passord - Leily 🔐`;
        break;
      case 'lease_ready':
        templateHtml = getLeaseReadyTemplate();
        subject = `Leieavtale klar for signering - Leily 📋`;
        break;
      case 'lease_signed':
        templateHtml = getLeaseSignedTemplate();
        subject = `Leieavtale signert - Leily ✅`;
        break;
      case 'account_deleted':
        templateHtml = getAccountDeletedTemplate();
        subject = `Konto avsluttet - Leily 👋`;
        break;
      case 'payment_reminder':
        // For now, use password reset template as fallback
        templateHtml = getPasswordResetTemplate();
        subject = `Påminnelse om leiebetaling - Leily 💰`;
        break;
      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }

    // Replace placeholders in template
    let renderedHtml = templateHtml;
    
    // Replace common placeholders
    renderedHtml = renderedHtml.replace(/\{\{name\}\}/g, data.name || '');
    renderedHtml = renderedHtml.replace(/\{\{email\}\}/g, data.email || '');
    renderedHtml = renderedHtml.replace(/\{\{support_email\}\}/g, data.support_email || 'kontakt@leily.no');
    renderedHtml = renderedHtml.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('no-NO'));
    
    // Replace custom placeholders from data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      renderedHtml = renderedHtml.replace(placeholder, String(value || ''));
    }

    return {
      html: renderedHtml,
      subject: subject
    };
    
  } catch (error) {
    console.error('Error rendering template:', error);
    throw new Error(`Failed to render template: ${error.message}`);
  }
}
