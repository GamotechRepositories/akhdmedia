import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/utils/phone_utils.dart';
import 'auth_screen_layout.dart';

class PhoneCountryField extends StatefulWidget {
  const PhoneCountryField({
    super.key,
    required this.controller,
    this.enabled = true,
    this.initialCountryCode = 'IN',
  });

  final TextEditingController controller;
  final bool enabled;
  final String initialCountryCode;

  @override
  State<PhoneCountryField> createState() => PhoneCountryFieldState();
}

class PhoneCountryFieldState extends State<PhoneCountryField> {
  late Country _country;

  @override
  void initState() {
    super.initState();
    _country = Country.tryParse(widget.initialCountryCode) ??
        Country.parse('IN');
  }

  String get internationalPhone => buildInternationalPhone(
        dialCode: _country.phoneCode,
        nationalNumber: widget.controller.text,
      );

  void _openCountryPicker() {
    if (!widget.enabled) return;

    showCountryPicker(
      context: context,
      favorite: const ['IN'],
      showPhoneCode: true,
      countryListTheme: CountryListThemeData(
        bottomSheetHeight: MediaQuery.sizeOf(context).height * 0.85,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        inputDecoration: InputDecoration(
          hintText: 'Search country or code',
          prefixIcon: const Icon(Icons.search_rounded),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AuthScreenMetrics.fieldRadius),
          ),
          enabledBorder: authFieldBorder(),
          focusedBorder: authFieldBorder(
            color: AuthScreenColors.primaryBlue,
            width: 1.5,
          ),
        ),
      ),
      onSelect: (country) => setState(() => _country = country),
    );
  }

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
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: widget.enabled ? _openCountryPicker : null,
                borderRadius: BorderRadius.circular(AuthScreenMetrics.fieldRadius),
                child: Ink(
                  height: AuthScreenMetrics.fieldHeight,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: authFieldDecoration(),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _country.flagEmoji,
                        style: const TextStyle(fontSize: 18),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '+${_country.phoneCode}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AuthScreenColors.textDark,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 18,
                        color: Colors.grey.shade500,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: widget.controller,
                enabled: widget.enabled,
                keyboardType: TextInputType.phone,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                maxLength: 15,
                style: const TextStyle(fontSize: 14, color: AuthScreenColors.textDark),
                decoration: authFieldInputDecoration(
                  hint: 'Mobile number',
                  prefixIcon: Icons.phone_outlined,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
