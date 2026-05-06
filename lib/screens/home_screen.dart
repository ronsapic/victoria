import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../config/api_config.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _profile;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final p = await widget.api.getProfile();
      if (mounted) setState(() => _profile = p);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _signOut() async {
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    await Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Victoria Portal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _signOut,
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'API: ${ApiConfig.baseUrl}',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    const SizedBox(height: 16),
                    if (_error != null)
                      Text(
                        _error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      )
                    else if (_profile != null) ...[
                      Text(
                        _profile!['email']?.toString() ?? '',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text('Role: ${_profile!['role']}'),
                    ],
                    const Spacer(),
                    OutlinedButton.icon(
                      onPressed: _load,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Refresh'),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
