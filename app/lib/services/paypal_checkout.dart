import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PayPalCheckout {
  Future<String> open({
    required BuildContext context,
    required String approvalUrl,
    String? subscriptionId,
  }) async {
    final paypalOrderId = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      builder: (context) => _PayPalCheckoutSheet(
        approvalUrl: approvalUrl,
        subscriptionId: subscriptionId,
      ),
    );

    if (paypalOrderId == null || paypalOrderId.isEmpty) {
      throw Exception('Payment cancelled');
    }

    return paypalOrderId;
  }
}

class _PayPalCheckoutSheet extends StatefulWidget {
  const _PayPalCheckoutSheet({required this.approvalUrl, this.subscriptionId});

  final String approvalUrl;
  final String? subscriptionId;

  @override
  State<_PayPalCheckoutSheet> createState() => _PayPalCheckoutSheetState();
}

class _PayPalCheckoutSheetState extends State<_PayPalCheckoutSheet> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri == null) return NavigationDecision.navigate;

            final path = uri.path.toLowerCase();
            if (widget.subscriptionId != null) {
              final isReturn =
                  uri.scheme == 'https' &&
                  (uri.host == 'akhdmedia.com' ||
                      uri.host == 'www.akhdmedia.com') &&
                  path == '/subscriptions/checkout';
              if (isReturn && uri.queryParameters['paypalCancelled'] == '1') {
                Navigator.of(context).pop();
                return NavigationDecision.prevent;
              }
              if (isReturn &&
                  uri.queryParameters['paypalSubscription'] ==
                      widget.subscriptionId) {
                Navigator.of(context).pop(widget.subscriptionId);
                return NavigationDecision.prevent;
              }
              return NavigationDecision.navigate;
            }
            if (path.contains('/paypal/complete') ||
                uri.queryParameters.containsKey('token')) {
              final token = uri.queryParameters['token'];
              if (token != null && token.isNotEmpty) {
                Navigator.of(context).pop(token);
                return NavigationDecision.prevent;
              }
            }

            if (path.contains('/checkout') &&
                uri.queryParameters['cancel'] == '1') {
              Navigator.of(context).pop();
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.approvalUrl));
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.92,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
                const Expanded(
                  child: Text(
                    'Pay with PayPal',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(width: 48),
              ],
            ),
          ),
          if (_loading) const LinearProgressIndicator(minHeight: 2),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: bottomInset),
              child: WebViewWidget(controller: _controller),
            ),
          ),
        ],
      ),
    );
  }
}
