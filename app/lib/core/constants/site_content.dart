class ContentSection {
  const ContentSection({required this.title, required this.paragraphs, this.bullets = const []});

  final String title;
  final List<String> paragraphs;
  final List<String> bullets;
}

class SiteContent {
  static const purchaseReasons = [
    ('personal', 'Personal collection'),
    ('digital', 'Digital media'),
    ('outlet', 'Media agency'),
    ('other', 'Other'),
  ];

  static const supportSubjects = [
    ('license_email', 'License / download email issue'),
    ('download', 'Video download problem'),
    ('payment', 'Payment issue'),
    ('license', 'License verification'),
    ('other', 'Other'),
  ];

  static const aboutSections = [
    ContentSection(
      title: 'About AKHD MEDIA & CO',
      paragraphs: [
        'Welcome to AKHD MEDIA & CO.',
        'AKHD MEDIA & CO is an independent digital media agency specializing in high-quality celebrity, entertainment, red-carpet, fashion, event, and editorial content. We provide professionally captured photos and videos for media organizations, news publishers, entertainment platforms, digital publishers, content creators, and editorial outlets worldwide.',
        'Our mission is to deliver timely, authentic, and high-quality visual content covering celebrity appearances, film promotions, public events, entertainment industry activities, and red-carpet moments.',
        'We are committed to maintaining professional standards in content creation, licensing, and digital distribution.',
      ],
    ),
    ContentSection(
      title: 'What we offer',
      paragraphs: [],
      bullets: [
        'Celebrity photographs',
        'Red-carpet event coverage',
        'Entertainment news footage',
        'Editorial videos and photography',
        'Event and public appearance coverage',
        'Digital media licensing',
      ],
    ),
    ContentSection(
      title: 'Our commitment',
      paragraphs: ['We strive to provide:'],
      bullets: [
        'High-quality media content',
        'Reliable digital delivery',
        'Professional licensing solutions',
        'Fast customer support',
        'Transparent business practices',
      ],
    ),
    ContentSection(
      title: 'Important notice',
      paragraphs: [
        'AKHD MEDIA & CO licenses content primarily for editorial, news-reporting, and informational purposes. Unless expressly stated in writing, purchases do not include celebrity endorsement, advertising, sponsorship, publicity, or commercial promotional rights.',
      ],
    ),
    ContentSection(
      title: 'Contact us',
      paragraphs: [
        'AKHD MEDIA & CO',
        'Email: support@akhdmedia.com',
        'WhatsApp: +91 8591443501',
      ],
    ),
  ];

  static List<ContentSection> policySections(String slug) {
    return _policies[slug] ?? [
      const ContentSection(
        title: 'Content',
        paragraphs: ['Policy content is being updated. Contact support@akhdmedia.com for questions.'],
      ),
    ];
  }

  static const _policies = <String, List<ContentSection>>{
    'privacy-policy': [
      ContentSection(
        title: 'Privacy policy',
        paragraphs: ['Last updated: 16 June 2026', 'We respect your privacy and are committed to protecting your personal information.'],
      ),
      ContentSection(
        title: '1. Information we collect',
        paragraphs: ['When you use our platform, we may collect:'],
        bullets: [
          'Name, email, phone number',
          'Billing and payment transaction details',
          'IP address and website usage data',
          'Customer support communications',
        ],
      ),
      ContentSection(
        title: '2. How we use your information',
        paragraphs: ['We use your information to process orders, deliver content, provide support, prevent fraud, improve our services, and comply with legal obligations.'],
      ),
      ContentSection(
        title: '3. Payment information',
        paragraphs: ['Payments are processed through third-party payment providers. We do not store complete card details on our servers.'],
      ),
      ContentSection(
        title: '4. Digital content delivery',
        paragraphs: ['After successful payment, customers receive access to downloadable files or delivery links via email.'],
      ),
      ContentSection(
        title: '5. Cookies',
        paragraphs: ['We use cookies to remember preferences, improve experience, analyze traffic, and detect fraud.'],
      ),
      ContentSection(
        title: '6. Contact',
        paragraphs: ['For privacy questions, email support@akhdmedia.com.'],
      ),
    ],
    'terms-and-conditions': [
      ContentSection(
        title: 'Terms & conditions',
        paragraphs: ['Last updated: 16 June 2026', 'By using AKHD MEDIA & CO you agree to these terms.'],
      ),
      ContentSection(
        title: '1. Service',
        paragraphs: ['We license digital media for editorial and informational use unless otherwise agreed in writing.'],
      ),
      ContentSection(
        title: '2. Accounts',
        paragraphs: ['You are responsible for keeping your login credentials secure and for activity under your account.'],
      ),
      ContentSection(
        title: '3. Purchases',
        paragraphs: ['All prices are in INR unless stated otherwise. Orders are fulfilled after successful payment verification.'],
      ),
      ContentSection(
        title: '4. License restrictions',
        paragraphs: ['Content may not be resold, sublicensed, or used for endorsement without written permission.'],
      ),
      ContentSection(
        title: '5. Liability',
        paragraphs: ['We are not liable for indirect damages arising from use of licensed content beyond fees paid.'],
      ),
    ],
    'refund-policy': [
      ContentSection(
        title: 'Refund policy',
        paragraphs: ['Last updated: 16 June 2026'],
      ),
      ContentSection(
        title: 'Digital products',
        paragraphs: [
          'Because our products are digital downloads delivered immediately after payment, refunds are generally not available once the license email or download link has been sent.',
        ],
      ),
      ContentSection(
        title: 'Eligible cases',
        paragraphs: ['We may issue refunds or replacements when:'],
        bullets: [
          'You were charged but did not receive access',
          'The delivered file is corrupted or unusable',
          'A duplicate charge occurred',
        ],
      ),
      ContentSection(
        title: 'How to request',
        paragraphs: ['Contact support@akhdmedia.com with your order number within 7 days of purchase.'],
      ),
    ],
    'editorial-policy': [
      ContentSection(
        title: 'Editorial policy',
        paragraphs: ['AKHD MEDIA & CO content is captured for news, entertainment reporting, and editorial purposes.'],
      ),
      ContentSection(
        title: 'Standards',
        paragraphs: ['We aim for accurate, timely, and professionally produced visual coverage of public events and appearances.'],
      ),
      ContentSection(
        title: 'Usage',
        paragraphs: ['Licensed content is intended for editorial storytelling—not advertising or celebrity endorsement unless explicitly licensed.'],
      ),
    ],
    'license-information-policy': [
      ContentSection(
        title: 'License information',
        paragraphs: ['Each purchase includes a standard editorial license unless otherwise stated on the product page.'],
      ),
      ContentSection(
        title: 'Permitted use',
        paragraphs: ['You may use licensed content in news articles, digital publications, broadcasts, and editorial projects.'],
      ),
      ContentSection(
        title: 'Restrictions',
        paragraphs: ['You may not use content for defamatory purposes, imply celebrity endorsement, or sublicense raw files to third parties.'],
      ),
      ContentSection(
        title: 'Certificate',
        paragraphs: ['A license certificate is emailed after successful payment. Keep it for your records.'],
      ),
    ],
  };

  static String policySlugFromPath(String path) {
    if (path.contains('privacy')) return 'privacy-policy';
    if (path.contains('terms')) return 'terms-and-conditions';
    if (path.contains('refund')) return 'refund-policy';
    if (path.contains('editorial')) return 'editorial-policy';
    if (path.contains('license')) return 'license-information-policy';
    return 'privacy-policy';
  }
}
