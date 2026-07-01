import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'auth_screen_layout.dart';

class PhoneCountryField extends StatelessWidget {
  const PhoneCountryField({
    super.key,
    required this.controller,
    this.enabled = true,
  });

  final TextEditingController controller;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Phone Number',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AuthScreenColors.textDark,
          ),
        ),
        const SizedBox(height: 5),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: AuthScreenMetrics.fieldHeight,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              alignment: Alignment.center,
              decoration: authFieldDecoration(),
              child: const Text(
                '+91',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AuthScreenColors.textDark,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                height: AuthScreenMetrics.fieldHeight,
                decoration: authFieldDecoration(),
                alignment: Alignment.center,
                child: TextField(
                  controller: controller,
                  enabled: enabled,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  maxLength: 10,
                  style: const TextStyle(fontSize: 14, color: AuthScreenColors.textDark),
                  decoration: InputDecoration(
                    counterText: '',
                    isDense: true,
                    hintText: 'Mobile number',
                    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                    prefixIcon: Icon(
                      Icons.phone_outlined,
                      color: Colors.grey.shade400,
                      size: 20,
                    ),
                    prefixIconConstraints: const BoxConstraints(minWidth: 44, minHeight: 40),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
