import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:akhdmedia_app/core/constants/site_content.dart';
import 'package:akhdmedia_app/screens/info/info_screens.dart';
import 'package:akhdmedia_app/screens/subscriptions/subscription_screens.dart';

void main() {
  test('subscription policy preserves all sections and its effective date', () {
    final sections = SiteContent.policySections('subscription-policy');
    expect(sections.length, 16);
    expect(sections.first.paragraphs.first, 'Effective Date: November 2, 2026');
    expect(sections.last.title, '15. Acceptance of Terms');
    expect(
      sections.expand((s) => s.paragraphs).join(' '),
      contains('within 6 hours'),
    );
  });

  testWidgets('subscription confirmation fits a small phone with large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: const TextScaler.linear(1.5)),
          child: child!,
        ),
        home: const SubscriptionSuccessScreen(),
      ),
    );
    expect(find.text('Your subscription is active'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.scrollUntilVisible(find.text('View my subscription'), 100);
    expect(find.text('View my subscription'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('full subscription policy renders in the app', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: PolicyScreen(
          title: 'Subscription Policy',
          policySlug: 'subscription-policy',
        ),
      ),
    );
    expect(find.text('Effective Date: November 2, 2026'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('15. Acceptance of Terms'), 500);
    expect(find.text('15. Acceptance of Terms'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
