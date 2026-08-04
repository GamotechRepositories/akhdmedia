import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'auth_screen_layout.dart';

/// Six individual digit boxes for OTP entry (auto-advance, paste, backspace).
class OtpDigitFields extends StatefulWidget {
  const OtpDigitFields({
    super.key,
    this.length = 6,
    this.enabled = true,
    this.autofocus = true,
    required this.onChanged,
    this.onCompleted,
  });

  final int length;
  final bool enabled;
  final bool autofocus;
  final ValueChanged<String> onChanged;
  final ValueChanged<String>? onCompleted;

  @override
  State<OtpDigitFields> createState() => OtpDigitFieldsState();
}

class OtpDigitFieldsState extends State<OtpDigitFields> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(widget.length, (_) => TextEditingController());
    _focusNodes = List.generate(widget.length, (_) => FocusNode());
    if (widget.autofocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && widget.enabled) {
          _focusNodes.first.requestFocus();
        }
      });
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get code => _controllers.map((c) => c.text).join();

  void clear() {
    for (final controller in _controllers) {
      controller.clear();
    }
    widget.onChanged('');
    if (widget.enabled && _focusNodes.isNotEmpty) {
      _focusNodes.first.requestFocus();
    }
    setState(() {});
  }

  void _emit() {
    final value = code;
    widget.onChanged(value);
    if (value.length == widget.length) {
      widget.onCompleted?.call(value);
    }
  }

  void _setDigits(String digits) {
    final cleaned = digits.replaceAll(RegExp(r'\D'), '');
    for (var i = 0; i < widget.length; i++) {
      _controllers[i].text = i < cleaned.length ? cleaned[i] : '';
    }
    _emit();
    if (!widget.enabled) return;
    if (cleaned.length >= widget.length) {
      _focusNodes.last.requestFocus();
      _focusNodes.last.unfocus();
    } else if (cleaned.isEmpty) {
      _focusNodes.first.requestFocus();
    } else {
      _focusNodes[cleaned.length].requestFocus();
    }
    setState(() {});
  }

  void _onChanged(int index, String value) {
    if (value.length > 1) {
      _setDigits(value);
      return;
    }

    if (value.isNotEmpty && !RegExp(r'^\d$').hasMatch(value)) {
      _controllers[index].text = '';
      return;
    }

    if (value.isNotEmpty && index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    }

    _emit();
    setState(() {});
  }

  KeyEventResult _onKey(int index, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;
    if (event.logicalKey != LogicalKeyboardKey.backspace) {
      return KeyEventResult.ignored;
    }
    if (_controllers[index].text.isEmpty && index > 0) {
      _controllers[index - 1].clear();
      _focusNodes[index - 1].requestFocus();
      _emit();
      setState(() {});
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Verification code',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AuthScreenColors.textDark,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: List.generate(widget.length, (index) {
            final filled = _controllers[index].text.isNotEmpty;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  left: index == 0 ? 0 : 4,
                  right: index == widget.length - 1 ? 0 : 4,
                ),
                child: Focus(
                  onKeyEvent: (node, event) => _onKey(index, event),
                  child: TextField(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    enabled: widget.enabled,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    textInputAction: index == widget.length - 1
                        ? TextInputAction.done
                        : TextInputAction.next,
                    maxLength: widget.length,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AuthScreenColors.textDark,
                      height: 1.2,
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                    decoration: InputDecoration(
                      counterText: '',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: filled
                              ? AuthScreenColors.primaryBlue
                              : Colors.grey.shade300,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: filled
                              ? AuthScreenColors.primaryBlue
                              : Colors.grey.shade300,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: AuthScreenColors.primaryBlue,
                          width: 1.5,
                        ),
                      ),
                      disabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade200),
                      ),
                    ),
                    onChanged: (value) => _onChanged(index, value),
                    onTap: () {
                      _controllers[index].selection = TextSelection(
                        baseOffset: 0,
                        extentOffset: _controllers[index].text.length,
                      );
                    },
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}
