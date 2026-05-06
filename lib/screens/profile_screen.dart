import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../config/api_config.dart';
import '../config/roles.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import '../widgets/fade_slide.dart';

/// Full account view with **role-specific** hints and shortcuts.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.api,
    required this.onNavigateTab,
  });

  final ApiService api;
  final ValueChanged<int> onNavigateTab;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
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

  void _popAndGo(int tab) {
    Navigator.of(context).pop();
    widget.onNavigateTab(tab);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final role = _profile?['role']?.toString();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your profile'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                Card(
                  color: scheme.errorContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      _error!,
                      style: TextStyle(color: scheme.onErrorContainer),
                    ),
                  ),
                )
              else if (_profile != null) ...[
                FadeSlide(child: _ProfileHeader(profile: _profile!)),
                const SizedBox(height: 18),
                FadeSlide(
                  delay: const Duration(milliseconds: 50),
                  child: _IdentitySection(profile: _profile!, scheme: scheme),
                ),
                const SizedBox(height: 16),
                FadeSlide(
                  delay: const Duration(milliseconds: 90),
                  child: _RoleHighlights(role: role, scheme: scheme),
                ),
                const SizedBox(height: 16),
                FadeSlide(
                  delay: const Duration(milliseconds: 130),
                  child: _ShortcutsCard(
                    role: role,
                    onPayments: () => _popAndGo(1),
                    onCommunity: () => _popAndGo(2),
                    onUnit: () => _popAndGo(3),
                    onSafety: () => _popAndGo(4),
                  ),
                ),
                const SizedBox(height: 16),
                FadeSlide(
                  delay: const Duration(milliseconds: 170),
                  child: Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(color: scheme.outlineVariant),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('API', style: Theme.of(context).textTheme.titleSmall),
                          const SizedBox(height: 6),
                          SelectableText(
                            ApiConfig.baseUrl,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: _signOut,
                  icon: const Icon(Icons.logout),
                  style: FilledButton.styleFrom(
                    backgroundColor: scheme.error,
                    foregroundColor: scheme.onError,
                  ),
                  label: const Text('Sign out'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.profile});

  final Map<String, dynamic> profile;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final email = profile['email']?.toString() ?? '';
    final role = profile['role']?.toString();
    final label = roleDisplayLabel(role);
    final initial = email.isNotEmpty
        ? email.substring(0, 1).toUpperCase()
        : '?';
    final chipColor = _roleChipColor(context, role);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            CircleAvatar(
              radius: 36,
              backgroundColor: scheme.primary.withValues(alpha: 0.2),
              child: Text(
                initial,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: scheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    profile['displayName']?.toString().trim().isNotEmpty == true
                        ? profile['displayName'].toString()
                        : email,
                    style: Theme.of(context).textTheme.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      Chip(
                        label: Text(label),
                        backgroundColor: chipColor.withValues(alpha: 0.2),
                        side: BorderSide(color: chipColor.withValues(alpha: 0.4)),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Color _roleChipColor(BuildContext context, String? role) {
  final scheme = Theme.of(context).colorScheme;
  switch (role) {
    case 'admin':
      return scheme.primary;
    case 'accountant':
      return scheme.tertiary;
    case 'staff':
      return Colors.deepOrange.shade700;
    case 'auditor':
      return scheme.secondary;
    case 'resident':
    default:
      return scheme.primary;
  }
}

class _IdentitySection extends StatelessWidget {
  const _IdentitySection({required this.profile, required this.scheme});

  final Map<String, dynamic> profile;
  final ColorScheme scheme;

  @override
  Widget build(BuildContext context) {
    final id = profile['id']?.toString() ?? '';
    final uid = profile['firebaseUid']?.toString() ?? '';
    final email = profile['email']?.toString() ?? '';

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      child: Column(
        children: [
          ListTile(
            leading: Icon(Icons.mail_outline, color: scheme.primary),
            title: const Text('Email'),
            subtitle: SelectableText(email),
          ),
          const Divider(height: 1),
          ListTile(
            leading: Icon(Icons.badge_outlined, color: scheme.primary),
            title: const Text('Portal user ID'),
            subtitle: SelectableText(id),
            trailing: IconButton(
              icon: const Icon(Icons.copy, size: 20),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: id));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Copied user ID')),
                );
              },
            ),
          ),
          const Divider(height: 1),
          ListTile(
            leading: Icon(Icons.fingerprint, color: scheme.primary),
            title: const Text('Firebase UID'),
            subtitle: SelectableText(
              uid.length > 18 ? '${uid.substring(0, 12)}…${uid.substring(uid.length - 6)}' : uid,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            trailing: IconButton(
              tooltip: 'Copy full UID',
              icon: const Icon(Icons.copy, size: 20),
              onPressed: uid.isEmpty
                  ? null
                  : () {
                      Clipboard.setData(ClipboardData(text: uid));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Copied Firebase UID')),
                      );
                    },
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleHighlights extends StatelessWidget {
  const _RoleHighlights({required this.role, required this.scheme});

  final String? role;
  final ColorScheme scheme;

  @override
  Widget build(BuildContext context) {
    final title = roleDisplayLabel(role);
    late final String body;
    if (isCommitteeRole(role)) {
      body =
          '$title accounts can publish documents to the resident register (committee uploads) and work '
          'with association records in the backend. Use Community → Documents.';
    } else if (role == 'staff') {
      body =
          'Caretaker / security accounts see resident receipt uploads under Payments so you can coordinate '
          'with the committee and finance team.';
    } else if (isAuditorRole(role)) {
      body =
          'Auditor accounts focus on reviewing documents and exports in line with governance — open '
          'Community for published materials.';
    } else if (isResident(role)) {
      body =
          'Resident accounts can upload payment receipts (saved in your history), read announcements, '
          'download published documents, review My Unit, and use Safety dialers.';
    } else {
      body = 'Signed in as $title. Use the shortcuts below for the tools available to you.';
    }

    return Card(
      elevation: 0,
      color: scheme.primary.withValues(alpha: 0.06),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline_rounded, color: scheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'What your profile can do',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: scheme.onSurfaceVariant,
                    height: 1.35,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShortcutsCard extends StatelessWidget {
  const _ShortcutsCard({
    required this.role,
    required this.onPayments,
    required this.onCommunity,
    required this.onUnit,
    required this.onSafety,
  });

  final String? role;
  final VoidCallback onPayments;
  final VoidCallback onCommunity;
  final VoidCallback onUnit;
  final VoidCallback onSafety;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    final items = <({String label, IconData icon, VoidCallback onTap})>[
      (label: 'Browse payments', icon: Icons.receipt_long, onTap: onPayments),
      (label: 'Community & files', icon: Icons.groups_outlined, onTap: onCommunity),
      (label: 'My unit', icon: Icons.apartment, onTap: onUnit),
      (label: 'Safety contacts', icon: Icons.health_and_safety_outlined, onTap: onSafety),
    ];

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Shortcuts (${roleDisplayLabel(role)})',
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
          ),
          for (final i in items)
            ListTile(
              leading: Icon(i.icon),
              title: Text(i.label),
              trailing: const Icon(Icons.chevron_right),
              onTap: i.onTap,
            ),
        ],
      ),
    );
  }
}
