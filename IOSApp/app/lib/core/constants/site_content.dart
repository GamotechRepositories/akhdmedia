import 'package:intl/intl.dart';

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

  static String get policyLastUpdatedLabel {
    return 'Last updated: ${DateFormat('dd/MM/yyyy').format(DateTime.now())}';
  }

  static String get policyEffectiveDateLabel {
    return 'Effective Date: ${DateFormat('dd MMMM yyyy').format(DateTime.now())}';
  }

  static List<ContentSection> policySections(String slug) {
    final sections = _policies[slug] ?? [
      const ContentSection(
        title: 'Content',
        paragraphs: ['Policy content is being updated. Contact support@akhdmedia.com for questions.'],
      ),
    ];
    return _applyLastUpdatedDate(sections);
  }

  static List<ContentSection> _applyLastUpdatedDate(List<ContentSection> sections) {
    if (sections.isEmpty) return sections;

    final first = sections.first;
    if (first.paragraphs.isEmpty) return sections;

    final paragraphs = List<String>.from(first.paragraphs);
    final firstLine = paragraphs.first.toLowerCase();
    if (firstLine.startsWith('last updated:')) {
      paragraphs[0] = policyLastUpdatedLabel;
    } else if (firstLine.startsWith('effective date:')) {
      paragraphs[0] = policyEffectiveDateLabel;
    }

    return [
      ContentSection(
        title: first.title,
        paragraphs: paragraphs,
        bullets: first.bullets,
      ),
      ...sections.skip(1),
    ];
  }

  static const _policies = <String, List<ContentSection>>{
    'privacy-policy': [
      ContentSection(
        title: 'Privacy policy',
        paragraphs: [
          'Last updated: 16/06/2026',
          'Welcome to AKHD MEDIA & CO. We respect your privacy and are committed to protecting your personal information.',
        ],
      ),
      ContentSection(
        title: '1. Information we collect',
        paragraphs: ['When you use our website, we may collect:'],
        bullets: [
          'Name',
          'Email address',
          'Phone number',
          'Billing information',
          'Payment transaction details',
          'IP address',
          'Website usage data',
          'Customer support communications',
        ],
      ),
      ContentSection(
        title: '2. How we use your information',
        paragraphs: ['We use your information to:'],
        bullets: [
          'Process orders and payments',
          'Deliver purchased digital content',
          'Provide customer support',
          'Verify transactions and prevent fraud',
          'Improve website functionality',
          'Send order confirmations and service notifications',
          'Comply with legal obligations',
        ],
      ),
      ContentSection(
        title: '3. Payment information',
        paragraphs: [
          'Payments are processed through third-party payment providers. We do not store complete credit card or debit card details on our servers.',
        ],
      ),
      ContentSection(
        title: '4. Digital content delivery',
        paragraphs: [
          'After successful payment, customers may receive access to downloadable files, streaming access, cloud-storage links, or other delivery methods.',
        ],
      ),
      ContentSection(
        title: '5. Cookies and analytics',
        paragraphs: ['Our website may use cookies and similar technologies to:'],
        bullets: [
          'Remember user preferences',
          'Improve user experience',
          'Analyze website traffic',
          'Detect fraudulent activity',
        ],
      ),
      ContentSection(
        title: '',
        paragraphs: [
          'Users may disable cookies through their browser settings, although some website features may not function properly.',
        ],
      ),
      ContentSection(
        title: '6. Sharing of information',
        paragraphs: [
          'We do not sell personal information to third parties.',
          'We may share information with:',
        ],
        bullets: [
          'Payment processors',
          'Hosting providers',
          'Cloud storage providers',
          'Legal authorities when required by law',
          'Professional advisors and service providers assisting our business',
        ],
      ),
      ContentSection(
        title: '7. Data security',
        paragraphs: [
          'We implement reasonable technical and organizational measures to protect personal information from unauthorized access, disclosure, alteration, or destruction.',
          'However, no internet transmission or electronic storage method is completely secure.',
        ],
      ),
      ContentSection(
        title: '8. Data retention',
        paragraphs: [
          'We retain customer information only as long as necessary for business, legal, accounting, tax, security, and regulatory purposes.',
        ],
      ),
      ContentSection(
        title: '9. Customer rights',
        paragraphs: ['Subject to applicable law, users may request:'],
        bullets: [
          'Access to their personal data',
          'Correction of inaccurate information',
          'Deletion of certain personal information',
          'Withdrawal of consent where applicable',
        ],
      ),
      ContentSection(
        title: '',
        paragraphs: ['Requests may be submitted using the contact information below.'],
      ),
      ContentSection(
        title: '10. Third-party services',
        paragraphs: [
          'Our website may contain links to third-party websites, cloud-storage services, payment gateways, and social media platforms. We are not responsible for their privacy practices.',
        ],
      ),
      ContentSection(
        title: '11. Children’s privacy',
        paragraphs: [
          'Our services are not directed toward children under the age required by applicable law. We do not knowingly collect personal information from children.',
        ],
      ),
      ContentSection(
        title: '12. Policy changes',
        paragraphs: [
          'We may update this Privacy Policy from time to time. Updated versions will be posted on this page with a revised effective date.',
        ],
      ),
      ContentSection(
        title: '13. Contact us',
        paragraphs: [
          'If you have questions regarding this Privacy Policy, please contact:',
          'Business Name: AKHD MEDIA & CO',
          'Email: support@akhdmedia.com',
          'Only WhatsApp: +91 85914 43501',
          'Support: available through the Support page in the app.',
          'Address: GR/RC/C3 NEW VIDARBHA SRA CHSL BLDG. NO.13',
          'NEHRU NAGAR GOLIBAR ROAD',
          'NR. PARAMOUNT CHS SANTACRUZ(E) MUMBAI 400055',
        ],
      ),
    ],
    'terms-and-conditions': [
      ContentSection(
        title: 'Terms & conditions',
        paragraphs: [
          'Last updated: 16/06/2026',
          'Welcome to AKHD MEDIA & CO. By accessing or using this website, purchasing content, or downloading any media from this platform, you agree to be bound by these Terms and Conditions.',
        ],
      ),
      ContentSection(
        title: '1. Acceptance of terms',
        paragraphs: [
          'By accessing this website, you confirm that you have read, understood, and agreed to these Terms and Conditions, the Privacy Policy, Refund Policy, and License Information Policy.',
        ],
      ),
      ContentSection(
        title: '2. Services',
        paragraphs: ['AKHD MEDIA & CO provides digital media content, including but not limited to:'],
        bullets: [
          'Celebrity photographs',
          'Red-carpet event footage',
          'Entertainment event coverage',
          'Paparazzi content',
          'Editorial photographs',
          'Editorial video footage',
        ],
      ),
      ContentSection(
        title: '3. Eligibility',
        paragraphs: [
          'You must be at least 18 years old and legally capable of entering into binding contracts to purchase content from this website.',
        ],
      ),
      ContentSection(
        title: '4. Account responsibility',
        paragraphs: [
          'Users are responsible for maintaining the confidentiality of their account credentials and for all activities conducted through their account.',
        ],
      ),
      ContentSection(
        title: '5. Payments',
        paragraphs: [
          'All payments must be completed through approved payment methods available on the website.',
          'AKHD MEDIA & CO reserves the right to refuse, cancel, or suspend any order suspected of fraud, abuse, or unauthorized activity.',
        ],
      ),
      ContentSection(
        title: '6. Digital delivery',
        paragraphs: [
          'Purchased content will be delivered electronically through download links, cloud-storage links, or other digital delivery methods.',
          'Delivery times may vary depending on technical requirements and payment verification.',
        ],
      ),
      ContentSection(
        title: '7. License of content',
        paragraphs: [
          'All content is licensed and not sold.',
          'Purchasing content grants only the usage rights expressly stated in the applicable License Information Policy.',
          'Copyright ownership remains with AKHD MEDIA & CO unless expressly transferred through a written agreement.',
        ],
      ),
      ContentSection(
        title: '8. Prohibited activities',
        paragraphs: ['Users shall not:'],
        bullets: [
          'Copy, redistribute, resell, sublicense, or share purchased files except as permitted by the applicable license.',
          'Remove copyright notices, watermarks, or ownership information.',
          'Use content for unlawful purposes.',
          'Misrepresent ownership of any content.',
          'Attempt to gain unauthorized access to the website or its systems.',
        ],
      ),
      ContentSection(
        title: '9. Celebrity rights and endorsements',
        paragraphs: [
          'Unless specifically stated in writing, no purchase includes celebrity endorsement, sponsorship, publicity, advertising, trademark, or personality rights.',
          'Content may not be used in a manner that implies a celebrity endorses or is affiliated with any product, service, company, organization, or brand.',
        ],
      ),
      ContentSection(
        title: '10. Intellectual property',
        paragraphs: [
          'All content, trademarks, logos, graphics, website design elements, text, photographs, videos, and media files remain the intellectual property of AKHD MEDIA & CO or its licensors.',
          'Unauthorized use may result in legal action.',
        ],
      ),
      ContentSection(
        title: '11. Copyright infringement claims',
        paragraphs: [
          'If you believe any content on this website infringes your copyright or other legal rights, please contact:',
          'Email: support@akhdmedia.com',
          'We will review legitimate complaints and take appropriate action where required.',
        ],
      ),
      ContentSection(
        title: '12. Disclaimer of warranties',
        paragraphs: [
          'All content and services are provided on an “as is” and “as available” basis.',
          'AKHD MEDIA & CO makes no guarantees regarding uninterrupted access, accuracy, availability, or suitability of the website or content.',
        ],
      ),
      ContentSection(
        title: '13. Limitation of liability',
        paragraphs: [
          'To the maximum extent permitted by law, AKHD MEDIA & CO shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising from the use of this website or its content.',
        ],
      ),
      ContentSection(
        title: '14. Indemnification',
        paragraphs: [
          'Users agree to indemnify and hold harmless AKHD MEDIA & CO from any claims, damages, liabilities, losses, costs, or expenses arising from their misuse of content or violation of these Terms.',
        ],
      ),
      ContentSection(
        title: '15. Termination',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to suspend or terminate access to the website or purchased licenses if a user violates these Terms and Conditions.',
        ],
      ),
      ContentSection(
        title: '16. Governing law and dispute resolution',
        paragraphs: [
          'These Terms and Conditions shall be governed by the laws of India.',
          'Any dispute arising out of or relating to these Terms shall first be addressed through good-faith negotiations.',
          'If unresolved, disputes shall be referred to binding arbitration under the Arbitration and Conciliation Act, 1996.',
          'The seat and venue of arbitration shall be Hyderabad, Telangana, India.',
          'Subject to the arbitration clause, courts located in Hyderabad, Telangana, India shall have exclusive jurisdiction.',
        ],
      ),
      ContentSection(
        title: '17. Modifications',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to modify these Terms and Conditions at any time. Updated versions will be published on this website.',
        ],
      ),
      ContentSection(
        title: '18. Contact information',
        paragraphs: [
          'AKHD MEDIA & CO',
          'Email: support@akhdmedia.com',
          'Only WhatsApp: +91 85914 43501',
          'Address: GR/RC/C3 NEW VIDARBHA SRA CHSL BLDG. NO.13',
          'NEHRU NAGAR GOLIBAR ROAD',
          'NR. PARAMOUNT CHS SANTACRUZ(E) MUMBAI 400055',
        ],
      ),
    ],
    'refund-policy': [
      ContentSection(
        title: 'Refund policy',
        paragraphs: [
          'Last updated: 16/06/2026',
          'Thank you for purchasing digital content from AKHD MEDIA & CO / www.akhdmedia.com.',
        ],
      ),
      ContentSection(
        title: '1. Digital products',
        paragraphs: [
          'All products sold on our website, including but not limited to celebrity videos, red carpet footage, paparazzi content, event videos, photographs, and other downloadable digital media, are digital products delivered electronically.',
        ],
      ),
      ContentSection(
        title: '2. No refund policy',
        paragraphs: [
          'Due to the nature of digital products, all sales are final. Once a customer has successfully received, downloaded, streamed, accessed, or obtained a download link for any digital content, no refund, cancellation, or exchange will be provided.',
        ],
      ),
      ContentSection(
        title: '3. Exceptions',
        paragraphs: ['Refunds may be considered only in the following circumstances:'],
        bullets: [
          'Duplicate payment made for the same order. If duplicate payment is made on the same day then we will process your refund.',
          'Payment successfully completed but digital content was not delivered and our support team is unable to provide access within a reasonable time.',
          'The purchased file is corrupted or inaccessible, and a replacement file cannot be provided.',
        ],
      ),
      ContentSection(
        title: '4. Customer responsibility',
        paragraphs: [
          'Customers are responsible for reviewing product descriptions, previews, licensing information, file formats, and compatibility requirements before making a purchase.',
          'Refunds will not be granted for:',
        ],
        bullets: [
          'Change of mind.',
          'Accidental purchases.',
          'Lack of knowledge about the product.',
          'Inability to use the file due to customer software or hardware limitations.',
          'Dissatisfaction with content that matches the product description.',
        ],
      ),
      ContentSection(
        title: '5. Refund request process',
        paragraphs: [
          'To request a refund under the limited exceptions above, customers must contact us within 7 days of purchase and provide:',
        ],
        bullets: [
          'Order number.',
          'Proof of payment.',
          'Description of the issue.',
        ],
      ),
      ContentSection(
        title: '6. Processing of approved refunds',
        paragraphs: [
          'If a refund is approved, it will be processed through the original payment method within 5-7 business days, subject to payment gateway and banking timelines.',
        ],
      ),
      ContentSection(
        title: '7. Contact information',
        paragraphs: [
          'For refund-related inquiries, please contact:',
          'Email: support@akhdmedia.com',
          'Only WhatsApp: +91 85914 43501',
          'Support: available through the Support page in the app.',
          'Address: GR/RC/C3 NEW VIDARBHA SRA CHSL BLDG. NO.13',
          'NEHRU NAGAR GOLIBAR ROAD',
          'NR. PARAMOUNT CHS SANTACRUZ(E) MUMBAI 400055',
          'By purchasing content from our website, you acknowledge that you have read, understood, and agreed to this Refund Policy.',
        ],
      ),
    ],
    'editorial-policy': [
      ContentSection(
        title: 'Editorial policy',
        paragraphs: [],
      ),
      ContentSection(
        title: '1. Personal-use rights',
        paragraphs: ['The buyer may use the content only for personal viewing or personal projects.'],
        bullets: [
          'Allowed: Download and watch the video.',
          'Allowed: Save the photos for personal collections.',
          'Not allowed: Re-sell the content.',
          'Not allowed: Upload it to YouTube, Instagram, or commercial websites.',
          'Not allowed: Use it in advertisements or business promotions.',
        ],
      ),
      ContentSection(
        title: '2. Editorial / news-use rights',
        paragraphs: ['This is common for celebrity, paparazzi, and red-carpet content.'],
        bullets: [
          'Allowed: Use in newspapers, magazines, blogs, news websites, and TV news.',
          'Allowed: Use in articles discussing celebrities, events, entertainment, or current affairs.',
          'Not allowed: Use in advertisements.',
          'Not allowed: Suggest that a celebrity endorses a product or service.',
          'Not allowed: Use for commercial marketing campaigns.',
        ],
      ),
      ContentSection(
        title: '3. Commercial-use rights',
        paragraphs: [
          'The purchased photos and videos may be used for editorial, news-reporting, informational, commentary, entertainment-news, and media-publication purposes, including newspapers, magazines, news websites, entertainment websites, blogs, digital media platforms, social media channels, YouTube news and commentary videos, and television news broadcasts.',
          'All copyright and ownership rights remain with AKHD MEDIA & CO. The purchaser receives a non-exclusive, non-transferable license to use the content solely for editorial and informational purposes.',
          'Any commercial advertising, brand endorsement, promotional, or merchandising use requires separate written permission and may require additional rights and clearances from the individuals depicted in the content.',
          'Important: Celebrity images and videos may involve publicity and personality rights. Even if you own the copyright in the footage, commercial use may require additional permission from the celebrity or their representatives under Indian law.',
        ],
        bullets: [
          'The content may not be used in advertisements or promotional campaigns.',
          'The content may not be used to endorse, promote, or market any product, service, company, brand, or organization.',
          'The content may not be used in a manner that suggests sponsorship, approval, endorsement, or affiliation by the celebrity featured in the content.',
          'The content may not be used on product packaging, merchandise, or commercial products.',
          'The content may not be used in paid advertising, sponsored content, or influencer marketing campaigns.',
          'The content may not be used in any unlawful, defamatory, misleading, or deceptive manner.',
        ],
      ),
      ContentSection(
        title: 'What buyers can do',
        paragraphs: [],
        bullets: [
          'Publish on news websites.',
          'Use in newspapers and magazines.',
          'Post on entertainment blogs.',
          'Use in editorial YouTube videos.',
          'Publish on social media pages for news, commentary, and entertainment reporting.',
          'Include in articles about celebrities, events, fashion, films, and public appearances.',
        ],
      ),
      ContentSection(
        title: 'What buyers cannot do',
        paragraphs: [],
        bullets: [
          'Use the content in advertisements.',
          'Promote a brand, product, or service.',
          'Claim celebrity endorsement.',
          'Use on product packaging or merchandise.',
          'Resell the original files.',
          'Transfer the license to another party without permission.',
        ],
      ),
      ContentSection(
        title: 'Copyright ownership',
        paragraphs: [
          'All copyrights and intellectual property rights in the content remain the property of AKHD MEDIA & CO. The purchaser receives only a limited license to use the content in accordance with this agreement.',
        ],
      ),
    ],
    'license-information-policy': [
      ContentSection(
        title: 'License information policy',
        paragraphs: [
          'Last updated: 16/05/2026',
          'This License Information Policy governs the use of all photos, videos, and other digital media available through AKHD MEDIA & CO.',
        ],
      ),
      ContentSection(
        title: '1. Copyright ownership',
        paragraphs: [
          'Unless otherwise stated, all photos, videos, footage, and digital content available on this website are protected by copyright and remain the exclusive property of AKHD MEDIA & CO.',
          'Purchasing content does not transfer copyright ownership to the buyer.',
        ],
      ),
      ContentSection(
        title: '2. License granted',
        paragraphs: [
          'Upon successful purchase, the buyer receives a limited, non-exclusive, non-transferable license to use the content in accordance with this Policy.',
        ],
      ),
      ContentSection(
        title: '3. Permitted uses',
        paragraphs: ['Purchased content may be used for:'],
        bullets: [
          'News reporting',
          'Personal collection',
          'Editorial publications',
          'Entertainment reporting',
          'Newspapers and magazines',
          'News websites',
          'Digital media platforms',
          'Blogs and online articles',
          'Social media news pages',
          'Editorial YouTube videos',
          'Television news and informational broadcasts',
        ],
      ),
      ContentSection(
        title: '4. Prohibited uses',
        paragraphs: ['The content may not be used:'],
        bullets: [
          'In advertisements or promotional campaigns.',
          'To market or endorse any product, service, company, or brand.',
          'In a way that suggests a celebrity supports, sponsors, recommends, or is affiliated with a product, service, or organization.',
          'On merchandise, packaging, or products for sale.',
          'For resale, redistribution, sublicensing, or file sharing.',
          'In unlawful, misleading, defamatory, offensive, or deceptive content.',
        ],
      ),
      ContentSection(
        title: '5. No celebrity endorsement rights',
        paragraphs: [
          'Purchase of content does not include any celebrity endorsement, sponsorship, publicity, personality, trademark, or advertising rights.',
          'Users are solely responsible for obtaining any additional permissions required for uses beyond editorial and informational purposes.',
        ],
      ),
      ContentSection(
        title: '6. Credit requirement',
        paragraphs: [
          'Where reasonably possible, users should provide credit to “AKHD MEDIA & CO” or as otherwise specified on the download page.',
        ],
      ),
      ContentSection(
        title: '7. Termination of license',
        paragraphs: [
          'Any violation of this Policy automatically terminates the license granted to the purchaser.',
          'Upon termination, the purchaser must immediately cease use of the content and remove it from all platforms under their control.',
        ],
      ),
      ContentSection(
        title: '8. Reservation of rights',
        paragraphs: [
          'All rights not expressly granted under this Policy are reserved by AKHD MEDIA & CO.',
        ],
      ),
      ContentSection(
        title: '9. Governing law, jurisdiction, and dispute resolution',
        paragraphs: [
          'This License Information Policy shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.',
          'Any dispute, claim, or controversy arising out of or relating to this Policy, the licensed content, or the use of such content shall first be addressed through good-faith negotiations between the parties.',
          'If the dispute cannot be resolved through negotiation, it shall be submitted to binding arbitration in accordance with the Arbitration and Conciliation Act, 1996, as amended from time to time. The arbitration shall be conducted by a sole arbitrator appointed in accordance with applicable law. The seat and venue of arbitration shall be Hyderabad, Telangana, India, and the proceedings shall be conducted in English.',
          'Notwithstanding the foregoing, AKHD MEDIA & CO may seek injunctive or equitable relief in any court of competent jurisdiction to protect its intellectual property rights or confidential information.',
          'Subject to the arbitration provisions above, the courts located in Hyderabad, Telangana, India shall have exclusive jurisdiction over matters relating to this Policy.',
        ],
      ),
      ContentSection(
        title: '10. Changes to this policy',
        paragraphs: [
          'We reserve the right to modify this License Information Policy at any time. Updated versions will be posted on this website.',
        ],
      ),
      ContentSection(
        title: '11. Contact information',
        paragraphs: [
          'For licensing inquiries, exclusive rights requests, or legal questions, please contact:',
          'Company Name: AKHD MEDIA & CO',
          'Email: support@akhdmedia.com',
          'Only WhatsApp: +91 85914 43501',
          'Address: GR/RC/C3 NEW VIDARBHA SRA CHSL BLDG. NO.13',
          'NEHRU NAGAR GOLIBAR ROAD',
          'NR. PARAMOUNT CHS SANTACRUZ(E) MUMBAI 400055',
        ],
      ),
    ],
    'legal-policy': [
      ContentSection(
        title: 'Legal policy',
        paragraphs: [
          'Effective Date: 04 July 2026',
          'This Legal Policy governs the use of the AKHD MEDIA & CO website, mobile applications, digital platforms, and services. By accessing or using our services, you agree to comply with this Legal Policy and all applicable laws.',
        ],
      ),
      ContentSection(
        title: '2. Ownership',
        paragraphs: [
          'All content published by AKHD MEDIA & CO, including but not limited to articles, videos, photographs, graphics, logos, trademarks, designs, source code, and other intellectual property, is owned by or licensed to AKHD MEDIA & CO and is protected under applicable copyright, trademark, and intellectual property laws.',
        ],
      ),
      ContentSection(
        title: '3. Editorial content',
        paragraphs: [
          'AKHD MEDIA & CO publishes news, media reports, interviews, and editorial content in good faith. While reasonable efforts are made to ensure accuracy, we do not guarantee that all information is complete, current, or error-free.',
        ],
      ),
      ContentSection(
        title: '4. Media coverage',
        paragraphs: [
          'Photographs and videos published by AKHD MEDIA & CO may be captured at officially organized media events, press conferences, public appearances, and other events where accredited media organizations are invited for editorial reporting. Such content is used solely for legitimate journalistic and editorial purposes.',
        ],
      ),
      ContentSection(
        title: '5. User responsibilities',
        paragraphs: ['Users agree not to:'],
        bullets: [
          'Violate any applicable law.',
          'Copy, reproduce, distribute, or commercially exploit our content without prior written permission.',
          'Upload malicious software or interfere with our services.',
          'Impersonate another person or provide false information.',
        ],
      ),
      ContentSection(
        title: '6. Third-party links',
        paragraphs: [
          'Our website may contain links to third-party websites. AKHD MEDIA & CO is not responsible for the content, policies, or practices of external websites.',
        ],
      ),
      ContentSection(
        title: '7. Limitation of liability',
        paragraphs: [
          'AKHD MEDIA & CO shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of our website, applications, services, or published content.',
        ],
      ),
      ContentSection(
        title: '8. Intellectual property infringement',
        paragraphs: [
          'If you believe your copyright or intellectual property has been infringed, please contact us with sufficient details. Valid complaints will be reviewed promptly, and appropriate action will be taken where required.',
        ],
      ),
      ContentSection(
        title: '9. Governing law',
        paragraphs: [
          'This Legal Policy shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra, India.',
        ],
      ),
      ContentSection(
        title: '10. Changes to this policy',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to modify or update this Legal Policy at any time. Changes become effective immediately upon publication on our website.',
        ],
      ),
      ContentSection(
        title: '11. Contact',
        paragraphs: [
          'For legal inquiries, copyright matters, or compliance-related questions, please contact AKHD MEDIA & CO using the official contact details published on our website.',
          'AKHD MEDIA & CO',
          'Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India.',
          'Email: support@akhdmedia.com',
          'Only WhatsApp: +918591443501',
        ],
      ),
    ],
    'media-accreditation-policy': [
      ContentSection(
        title: 'MEDIA ACCREDITATION & EDITORIAL EVENT COVERAGE POLICY',
        paragraphs: [
          'Last updated: 04/07/2026',
          'AKHD MEDIA & CO is an independent editorial media organization that captures original photos and videos at entertainment events, award ceremonies, film promotions, press conferences, red carpet events, and other public media events.',
        ],
      ),
      ContentSection(
        title: '2. Media accreditation and event access',
        paragraphs: [
          'Our photographers and videographers attend events only after receiving media accreditation, official invitations, press access, or authorization from event organizers, public relations (PR) agencies, or other authorized representatives. We do not obtain unauthorized access to private events.',
        ],
      ),
      ContentSection(
        title: '3. Original content',
        paragraphs: [
          'All photos, videos, and digital media distributed through our platform are created by our own production team using our own equipment. We do not copy, scrape, download, or redistribute third-party copyrighted content.',
        ],
      ),
      ContentSection(
        title: '4. Editorial purpose',
        paragraphs: [
          'Content captured at accredited media events is produced exclusively for editorial, journalistic, and news-reporting purposes. Our licensed customers may use such content in accordance with our Editorial Policy and License Information Policy.',
        ],
      ),
      ContentSection(
        title: '5. No commercial endorsement',
        paragraphs: [
          'The availability or licensing of editorial content through our platform does not imply that any individual, celebrity, public figure, organizer, or brand endorses AKHD MEDIA & CO or any purchaser of the content. Any commercial advertising, promotional use, or implied endorsement requires separate legal rights and permissions where applicable.',
        ],
      ),
      ContentSection(
        title: '6. Compliance with event rules',
        paragraphs: [
          'Our media team complies with all applicable event rules, accreditation requirements, venue policies, and applicable laws while covering events. We respect restrictions imposed by organizers regarding photography, videography, or content distribution.',
        ],
      ),
      ContentSection(
        title: '7. Rights management',
        paragraphs: [
          'Copyright in all original content remains with AKHD MEDIA & CO unless otherwise agreed in writing. Customers receive only the rights expressly granted under our License Information Policy.',
        ],
      ),
      ContentSection(
        title: '8. Questions',
        paragraphs: [
          'For questions regarding media accreditation, editorial licensing, or event coverage, please contact:',
          'AKHD MEDIA & CO',
          'Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India.',
          'Email: support@akhdmedia.com',
          'WhatsApp: +91 8591443501',
        ],
      ),
    ],
    'copyright-policy': [
      ContentSection(
        title: 'Copyright policy',
        paragraphs: ['Last updated: 1 July 2026'],
      ),
      ContentSection(
        title: '1. Introduction',
        paragraphs: [
          'This Copyright Policy explains how AKHD MEDIA & CO protects, manages, and licenses the intellectual property available on AKHDMEDIA.COM.',
          'By accessing, purchasing, or using any content from our platform, you agree to respect the copyright rights described in this Policy and in our other applicable policies.',
        ],
      ),
      ContentSection(
        title: '2. Copyright ownership',
        paragraphs: [
          'Unless otherwise stated, all videos, photographs, footage, preview clips, thumbnails, metadata, graphics, logos, text, and other digital materials published on AKHDMEDIA.COM are protected by copyright and remain the exclusive property of AKHD MEDIA & CO or its licensors.',
          'Purchasing a license does not transfer copyright ownership to the buyer.',
        ],
      ),
      ContentSection(
        title: '3. Limited license granted',
        paragraphs: [
          'Upon successful purchase, customers receive only a limited, non-exclusive, non-transferable license to use the content in accordance with the applicable License Information Policy, Editorial Policy, and purchased license tier.',
        ],
      ),
      ContentSection(
        title: '4. Prohibited uses',
        paragraphs: ['Without prior written permission, users may not:'],
        bullets: [
          'Copy, reproduce, distribute, or publicly display our content outside the licensed scope.',
          'Resell, sublicense, rent, lease, or transfer licensed files.',
          'Upload our content to stock agencies, marketplaces, or file-sharing platforms.',
          'Remove, alter, or bypass watermarks, copyright notices, or metadata.',
          'Claim ownership, authorship, or exclusive rights in our content.',
          'Use our content for AI training, dataset creation, or synthetic media generation.',
        ],
      ),
      ContentSection(
        title: '5. Watermarks and preview content',
        paragraphs: [
          'Preview files, thumbnails, and watermarked media are provided for evaluation purposes only. They remain protected by copyright and may not be used, published, or distributed without a valid license.',
        ],
      ),
      ContentSection(
        title: '6. Enforcement',
        paragraphs: [
          'Unauthorized use of our copyrighted content may result in license revocation, account suspension, termination of access, and legal action for copyright infringement, breach of contract, or other applicable claims.',
        ],
      ),
      ContentSection(
        title: '7. Reporting infringement',
        paragraphs: [
          'If you believe your copyright has been infringed by content on our website, please follow the procedure described in our DMCA / Copyright Infringement Policy.',
        ],
      ),
      ContentSection(
        title: '8. Policy updates',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to modify this Copyright Policy at any time. Updated versions become effective immediately upon publication on AKHDMEDIA.COM.',
        ],
      ),
      ContentSection(
        title: 'Contact',
        paragraphs: [
          'AKHD MEDIA & CO',
          'Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India.',
          'Website: https://www.akhdmedia.com',
          'Email: support@akhdmedia.com',
        ],
      ),
    ],
    'dmca-copyright-infringement-policy': [
      ContentSection(
        title: 'DMCA / Copyright infringement policy',
        paragraphs: ['Last updated: 1 July 2026'],
      ),
      ContentSection(
        title: '1. Introduction',
        paragraphs: [
          'AKHD MEDIA & CO respects the intellectual property rights of others and expects all users of AKHDMEDIA.COM to do the same.',
          'This DMCA / Copyright Infringement Policy explains the procedure for reporting alleged copyright infringement relating to content available on our website.',
        ],
      ),
      ContentSection(
        title: '2. Reporting copyright infringement',
        paragraphs: [
          'If you believe that any content available on AKHDMEDIA.COM infringes your copyright or other intellectual property rights, you may submit a written Copyright Infringement Notice containing the following information:',
        ],
        bullets: [
          'Your full legal name.',
          'Your contact information (email address, phone number, and postal address).',
          'A description of the copyrighted work claimed to have been infringed.',
          'The exact URL or location of the allegedly infringing material.',
          'A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or applicable law.',
          'A statement that the information provided is accurate and that you are the copyright owner or authorized to act on behalf of the copyright owner.',
          'Your physical or electronic signature.',
        ],
      ),
      ContentSection(
        title: '3. Submission of notices',
        paragraphs: [
          'Please send all copyright infringement notices to:',
          'Copyright Officer',
          'AKHD MEDIA & CO',
          'Email: support@akhdmedia.com',
          'Incomplete or inaccurate notices may delay our review process.',
        ],
      ),
      ContentSection(
        title: '4. Review process',
        paragraphs: ['Upon receiving a valid copyright complaint, AKHD MEDIA & CO will:'],
        bullets: [
          'Review the complaint in good faith.',
          'Evaluate the supporting information.',
          'Contact the reporting party if additional information is required.',
          'Remove, restrict, or disable access to the disputed content where legally appropriate.',
          'Take any additional action required under applicable law.',
        ],
      ),
      ContentSection(
        title: '5. Counter-notification',
        paragraphs: [
          'If you believe that content removed or restricted due to a copyright complaint was removed in error or misidentification, you may submit a written counter-notification containing appropriate supporting information.',
          'AKHD MEDIA & CO will review all valid counter-notifications and respond in accordance with applicable law.',
        ],
      ),
      ContentSection(
        title: '6. Repeat infringers',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to suspend or permanently terminate the accounts of users who repeatedly violate copyright or intellectual property rights.',
        ],
      ),
      ContentSection(
        title: '7. False claims',
        paragraphs: [
          'Submitting false, misleading, or fraudulent copyright complaints or counter-notifications may result in legal liability under applicable law.',
          'AKHD MEDIA & CO reserves all legal rights against any person who knowingly submits false claims.',
        ],
      ),
      ContentSection(
        title: '8. No waiver of rights',
        paragraphs: [
          'Nothing in this Policy limits or waives any copyright, intellectual property, contractual, or legal rights available to AKHD MEDIA & CO under applicable laws.',
        ],
      ),
      ContentSection(
        title: '9. Policy updates',
        paragraphs: [
          'AKHD MEDIA & CO may update this DMCA / Copyright Infringement Policy at any time. Any revised version becomes effective immediately upon publication on AKHDMEDIA.COM.',
        ],
      ),
      ContentSection(
        title: 'Contact',
        paragraphs: [
          'AKHD MEDIA & CO',
          'Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India.',
          'Website: https://www.akhdmedia.com',
          'Email: support@akhdmedia.com',
        ],
      ),
    ],
    'acceptable-use-policy': [
      ContentSection(
        title: 'Acceptable use policy',
        paragraphs: ['Last updated: 1 July 2026'],
      ),
      ContentSection(
        title: '1. Introduction',
        paragraphs: [
          'Welcome to AKHD MEDIA & CO. This Acceptable Use Policy outlines the rules governing the use of AKHDMEDIA.COM and all content, services, and licensed materials provided through our platform.',
          'By accessing or using our website, purchasing a license, or downloading any content, you agree to comply with this Policy.',
        ],
      ),
      ContentSection(
        title: '2. Lawful use',
        paragraphs: [
          'You agree to use our website and licensed content only for lawful purposes and in accordance with all applicable local, national, and international laws and regulations.',
          'You are solely responsible for ensuring that your use of our content complies with the terms of your purchased license.',
        ],
      ),
      ContentSection(
        title: '3. Permitted use',
        paragraphs: ['You may:'],
        bullets: [
          'Browse and search our website.',
          'Preview watermarked content.',
          'Purchase licenses for available content.',
          'Download licensed content after successful payment.',
          'Use licensed content strictly within the scope of the purchased license.',
        ],
      ),
      ContentSection(
        title: '4. Prohibited activities',
        paragraphs: ['Users must not:'],
        bullets: [
          'Copy, reproduce, or redistribute our content without authorization.',
          'Resell, sublicense, rent, lease, or transfer licensed content.',
          'Share downloaded files with any third party.',
          'Upload our content to stock agencies, marketplaces, or file-sharing platforms.',
          'Remove, crop, alter, or bypass watermarks from preview files.',
          'Claim ownership or authorship of our content.',
          'Use automated tools, bots, scrapers, or data mining software to collect website content or metadata.',
          'Attempt to gain unauthorized access to our systems, servers, or user accounts.',
          'Upload malicious software, viruses, or harmful code.',
          'Interfere with the security or normal operation of the website.',
          'Misrepresent the origin or ownership of our content.',
        ],
      ),
      ContentSection(
        title: '5. Editorial content restrictions',
        paragraphs: ['Unless expressly permitted under the purchased license, users may not:'],
        bullets: [
          'Use editorial footage for advertising, product promotion, or commercial endorsements.',
          'Suggest that any person, celebrity, brand, or organization featured in the footage endorses any product, service, or opinion.',
          'Use editorial content in a misleading, defamatory, unlawful, or deceptive manner.',
        ],
      ),
      ContentSection(
        title: '6. Artificial intelligence (AI) restrictions',
        paragraphs: ['Unless expressly authorized in writing by AKHD MEDIA & CO, users may not use our content for:'],
        bullets: [
          'AI model training.',
          'Machine learning datasets.',
          'Deepfake generation.',
          'Facial recognition systems.',
          'Computer vision datasets.',
          'Synthetic media creation.',
          'Automated content scraping or dataset collection.',
        ],
      ),
      ContentSection(
        title: '7. Account responsibility',
        paragraphs: ['If you create an account on AKHDMEDIA.COM, you are responsible for:'],
        bullets: [
          'Maintaining the confidentiality of your login credentials.',
          'All activities conducted through your account.',
          'Providing accurate and up-to-date information.',
        ],
      ),
      ContentSection(
        title: '8. Enforcement',
        paragraphs: ['Violation of this Policy may result in one or more of the following actions:'],
        bullets: [
          'Suspension or termination of your account.',
          'Revocation of purchased licenses.',
          'Removal of access to purchased content where permitted by law.',
          'Legal action for copyright infringement, breach of contract, or other applicable claims.',
          'Claims for damages and any other remedies available under applicable law.',
        ],
      ),
      ContentSection(
        title: '9. Policy updates',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to modify this Acceptable Use Policy at any time. Updated versions become effective immediately upon publication on AKHDMEDIA.COM.',
        ],
      ),
      ContentSection(
        title: 'Contact',
        paragraphs: [
          'AKHD MEDIA & CO',
          'Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India.',
          'Website: https://www.akhdmedia.com',
          'Email: support@akhdmedia.com',
        ],
      ),
    ],
    'ai-usage-policy': [
      ContentSection(
        title: 'AI usage policy',
        paragraphs: ['Strict prohibition on AI use', 'Last updated: 1 July 2026'],
      ),
      ContentSection(
        title: '1. Introduction',
        paragraphs: [
          'This AI Usage Policy governs the use of all content available on AKHDMEDIA.COM in connection with Artificial Intelligence (AI), Machine Learning (ML), Large Language Models (LLMs), Generative AI, and any similar technologies.',
          'By accessing, purchasing, downloading, or using any content from our website, you acknowledge and agree to comply with this Policy.',
        ],
      ),
      ContentSection(
        title: '2. Ownership of content',
        paragraphs: [
          'All videos, preview clips, thumbnails, metadata, graphics, logos, text, and all other materials available on AKHDMEDIA.COM are the exclusive intellectual property of AKHD MEDIA & CO.',
          'Purchasing a license grants only the limited usage rights specified in the applicable license and does not transfer ownership or copyright of the content.',
        ],
      ),
      ContentSection(
        title: '3. Strict prohibition on AI use',
        paragraphs: [
          'AKHD MEDIA & CO strictly prohibits the use of any of its content for Artificial Intelligence (AI) purposes.',
          'We do not grant, sell, license, authorize, or permit the use of any of our content for AI-related activities under any circumstances.',
        ],
        bullets: [
          'Licensed videos',
          'Preview videos',
          'Watermarked previews',
          'Thumbnails',
          'Images',
          'Metadata',
          'Captions',
          'Text',
          'Graphics',
          'Logos',
          'Any other digital content published by AKHD MEDIA & CO',
        ],
      ),
      ContentSection(
        title: '4. Prohibited AI activities',
        paragraphs: ['Our content must not be used for, including but not limited to:'],
        bullets: [
          'Training Artificial Intelligence (AI) models.',
          'Training Machine Learning (ML) systems.',
          'Large Language Models (LLMs).',
          'Generative AI systems.',
          'AI dataset creation.',
          'Computer vision systems.',
          'Facial recognition technologies.',
          'Biometric identification systems.',
          'Deepfake generation.',
          'Synthetic media creation.',
          'AI-assisted image or video generation.',
          'Automated data collection for AI development.',
          'Web scraping or harvesting content for AI purposes.',
          'Fine-tuning existing AI models.',
          'Any present or future AI-related technologies.',
        ],
      ),
      ContentSection(
        title: '5. No AI rights are granted',
        paragraphs: [
          'No license sold by AKHD MEDIA & CO includes any right to train AI systems, develop AI products, build AI datasets, improve AI models, feed our content into AI software, or use our content for automated learning systems.',
          'AI rights are expressly excluded from every license offered by AKHD MEDIA & CO.',
        ],
      ),
      ContentSection(
        title: '6. Monitoring and enforcement',
        paragraphs: ['Any violation of this Policy may result in:'],
        bullets: [
          'Immediate termination of the license.',
          'Permanent suspension of user accounts.',
          'Revocation of access to licensed content.',
          'Legal action for copyright infringement.',
          'Claims for damages, injunctive relief, and any other remedies available under applicable law.',
        ],
      ),
      ContentSection(
        title: '7. Relationship with other policies',
        paragraphs: [
          'This AI Usage Policy forms an integral part of our Terms & Conditions, License Information Policy, Copyright Policy, and Acceptable Use Policy.',
          'Any violation of this Policy shall also constitute a violation of those policies.',
        ],
      ),
      ContentSection(
        title: '8. Policy updates',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to amend or update this AI Usage Policy at any time. Any changes become effective immediately upon publication on AKHDMEDIA.COM.',
        ],
      ),
      ContentSection(
        title: 'Contact',
        paragraphs: [
          'AKHD MEDIA & CO',
          'Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India.',
          'Website: https://www.akhdmedia.com',
          'Email: support@akhdmedia.com',
        ],
      ),
    ],
    'disclaimer': [
      ContentSection(
        title: 'Disclaimer',
        paragraphs: ['Last updated: 1 July 2026'],
      ),
      ContentSection(
        title: '1. Introduction',
        paragraphs: [
          'This Disclaimer governs your access to and use of AKHDMEDIA.COM and all content, products, and services provided through our website.',
          'By accessing or using our website, you acknowledge that you have read, understood, and agreed to this Disclaimer.',
        ],
      ),
      ContentSection(
        title: '2. Informational purpose',
        paragraphs: [
          'The information, descriptions, metadata, captions, and other materials available on AKHDMEDIA.COM are provided for general informational purposes only.',
          'While we make reasonable efforts to ensure accuracy, we do not guarantee that all information is complete, accurate, current, or free from errors.',
        ],
      ),
      ContentSection(
        title: '3. No warranties',
        paragraphs: [
          'All content, services, and licensed materials are provided "AS IS" and "AS AVAILABLE", without any express or implied warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, title, or non-infringement, to the fullest extent permitted by applicable law.',
        ],
      ),
      ContentSection(
        title: '4. Editorial content',
        paragraphs: [
          'AKHD MEDIA & CO provides licensed editorial video content captured at officially organized public events, media events, red carpet appearances, press conferences, entertainment events, and other newsworthy occasions where accredited media are permitted to record public appearances.',
          'The availability of editorial content on our website does not imply any endorsement, sponsorship, affiliation, approval, or partnership by any individual, celebrity, brand, organization, or event organizer.',
        ],
      ),
      ContentSection(
        title: '5. Customer responsibility',
        paragraphs: [
          'Customers are solely responsible for ensuring that their use of licensed content complies with the purchased license, applicable laws and regulations, and any required third-party rights or permissions, where applicable.',
          'AKHD MEDIA & CO is not responsible for any misuse of licensed content by customers or third parties.',
        ],
      ),
      ContentSection(
        title: '6. Limitation of liability',
        paragraphs: [
          'To the fullest extent permitted by law, AKHD MEDIA & CO shall not be liable for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages arising from or related to the use or inability to use our website, licensed content or digital downloads, website interruptions, errors, or technical issues, or loss of data, profits, revenue, business opportunities, or goodwill.',
        ],
      ),
      ContentSection(
        title: '7. Third-party services',
        paragraphs: [
          'Our website may integrate or link to third-party services, including payment providers or other external platforms.',
          'AKHD MEDIA & CO is not responsible for the content, policies, security, availability, or practices of any third-party websites or services.',
        ],
      ),
      ContentSection(
        title: '8. Policy updates',
        paragraphs: [
          'AKHD MEDIA & CO reserves the right to modify this Disclaimer at any time. Any changes become effective immediately upon publication on AKHDMEDIA.COM.',
        ],
      ),
      ContentSection(
        title: 'Contact',
        paragraphs: [
          'AKHD MEDIA & CO',
          'Ground Floor, RC/C3, 13 Nehru Nagar, New Vidharbha Cooperative Society, Golibar Road, Near Paramount CHS, Santacruz East, Mumbai, Maharashtra – 400055, India.',
          'Website: https://www.akhdmedia.com',
          'Email: support@akhdmedia.com',
        ],
      ),
    ],
  };

  static String policySlugFromPath(String path) {
    if (path.contains('dmca')) return 'dmca-copyright-infringement-policy';
    if (path.contains('copyright')) return 'copyright-policy';
    if (path.contains('acceptable-use')) return 'acceptable-use-policy';
    if (path.contains('ai-usage')) return 'ai-usage-policy';
    if (path.contains('disclaimer')) return 'disclaimer';
    if (path.contains('privacy')) return 'privacy-policy';
    if (path.contains('legal')) return 'legal-policy';
    if (path.contains('media-accreditation')) return 'media-accreditation-policy';
    if (path.contains('terms')) return 'terms-and-conditions';
    if (path.contains('refund')) return 'refund-policy';
    if (path.contains('editorial')) return 'editorial-policy';
    if (path.contains('license')) return 'license-information-policy';
    return 'privacy-policy';
  }
}
