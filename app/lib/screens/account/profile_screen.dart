import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/auth/auth_modal_shell.dart' show showAuthErrorDialog;
import '../../widgets/auth/auth_screen_layout.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _nameCtrl.text = user.name;
      _phoneCtrl.text = user.phone;
      _emailCtrl.text = user.email;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);

    try {
      await context.read<AuthProvider>().updateProfile(
            name: _nameCtrl.text.trim(),
            phone: _phoneCtrl.text.trim(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Update failed',
        message: e.toString(),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    if (user == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF1F5F9),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          foregroundColor: const Color(0xFF0F172A),
          title: const Text('Edit Profile'),
        ),
        body: Center(
          child: FilledButton(
            onPressed: () => context.push('/login?redirect=${Uri.encodeComponent('/profile')}'),
            child: const Text('Sign in'),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF0F172A),
        title: const Text(
          'Edit Profile',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        children: [
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.asset('assets/IMG_1577.jpg', width: 80, height: 80, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 24),
          AuthStyledField(
            label: 'Email Address',
            controller: _emailCtrl,
            hint: user.email,
            prefixIcon: Icons.mail_outline_rounded,
            enabled: false,
          ),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          AuthStyledField(
            label: 'Full Name',
            controller: _nameCtrl,
            hint: 'Enter your full name',
            prefixIcon: Icons.person_outline_rounded,
            textInputAction: TextInputAction.next,
            enabled: !_saving,
          ),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          AuthStyledField(
            label: 'Phone Number',
            controller: _phoneCtrl,
            hint: 'Enter your phone number',
            prefixIcon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _save(),
            enabled: !_saving,
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          AuthActionButton(
            label: 'Save Changes',
            loading: _saving,
            onPressed: _save,
          ),
        ],
      ),
    );
  }
}
