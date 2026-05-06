import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../config/api_config.dart';
import '../config/roles.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'profile_screen.dart';
import '../widgets/fade_slide.dart';
import '../widgets/vp_association_logo.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api, required this.onNavigate});

  final ApiService api;
  final ValueChanged<int> onNavigate;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _profile;
  String? _error;
  bool _loading = true;
  bool _refreshing = false;

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

  Future<void> _refresh() async {
    setState(() {
      _refreshing = true;
      _error = null;
    });
    try {
      final p = await widget.api.getProfile();
      if (mounted) setState(() => _profile = p);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _refreshing = false);
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

  Future<void> _openProfile() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => ProfileScreen(
          api: widget.api,
          onNavigateTab: widget.onNavigate,
        ),
      ),
    );
    if (mounted) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        title: VpAssociationLogo(
          height: 40,
          width: 200,
          fit: BoxFit.contain,
          borderRadius: BorderRadius.circular(8),
        ),
        actions: [
          IconButton(
            tooltip: 'Profile',
            icon: const Icon(Icons.person_outline),
            onPressed: _loading ? null : _openProfile,
          ),
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: _signOut,
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              FadeSlide(
                child: _WelcomeCard(
                  email: _profile?['email']?.toString(),
                  role: _profile?['role']?.toString(),
                  displayName: _profile?['displayName']?.toString(),
                  loading: _loading,
                  onTap: _loading ? null : _openProfile,
                ),
              ),
              const SizedBox(height: 12),
              FadeSlide(
                delay: const Duration(milliseconds: 70),
                child: _StatusRow(
                  api: ApiConfig.baseUrl,
                  refreshing: _refreshing,
                ),
              ),
              const SizedBox(height: 12),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _loading
                    ? const Padding(
                        padding: EdgeInsets.only(top: 28),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    : _error != null
                        ? Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: _ErrorCard(text: _error!),
                          )
                        : FadeSlide(
                            delay: const Duration(milliseconds: 120),
                            child: Column(
                              children: [
                                _ActionGrid(
                                  onRefresh: _refresh,
                                  onNavigate: widget.onNavigate,
                                  onOpenProfile: _openProfile,
                                ),
                                const SizedBox(height: 12),
                                Card(
                                  elevation: 0,
                                  color: scheme.surface,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24),
                                    side: BorderSide(color: scheme.outlineVariant),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 44,
                                          height: 44,
                                          decoration: BoxDecoration(
                                            color: scheme.primary.withValues(alpha: 0.14),
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: Icon(Icons.security, color: scheme.primary),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            'Tip: pull down to refresh your access and profile.',
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodyMedium
                                                ?.copyWith(color: scheme.onSurfaceVariant),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _welcomeSubtitle(String? email, String? role, String? displayName) {
  final name = displayName?.trim();
  final r = roleDisplayLabel(role);
  if (name != null && name.isNotEmpty) {
    return '$name • $r';
  }
  return '${email ?? '—'} • $r';
}

class _WelcomeCard extends StatelessWidget {
  const _WelcomeCard({
    this.email,
    this.role,
    this.displayName,
    required this.loading,
    this.onTap,
  });

  final String? email;
  final String? role;
  final String? displayName;
  final bool loading;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final interactive = onTap != null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Card(
          elevation: 0,
          margin: EdgeInsets.zero,
          color: scheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(color: scheme.outlineVariant),
          ),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: scheme.primary.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(Icons.account_circle, color: scheme.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        interactive ? 'Tap for full profile' : 'Your account',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 220),
                        child: loading
                            ? Text(
                                'Loading profile…',
                                key: const ValueKey('loading'),
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: scheme.onSurfaceVariant),
                              )
                            : Text(
                                _welcomeSubtitle(email, role, displayName),
                                key: const ValueKey('loaded'),
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: scheme.onSurfaceVariant),
                              ),
                      ),
                    ],
                  ),
                ),
                if (interactive)
                  Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({required this.api, required this.refreshing});

  final String api;
  final bool refreshing;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(
          child: Card(
            elevation: 0,
            color: scheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: scheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Icon(Icons.cloud_outlined, color: scheme.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      api,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: refreshing
              ? const SizedBox(
                  key: ValueKey('spin'),
                  width: 36,
                  height: 36,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const SizedBox(key: ValueKey('idle'), width: 36, height: 36),
        ),
      ],
    );
  }
}

class _ActionGrid extends StatelessWidget {
  const _ActionGrid({
    required this.onRefresh,
    required this.onNavigate,
    required this.onOpenProfile,
  });

  final VoidCallback onRefresh;
  final ValueChanged<int> onNavigate;
  final Future<void> Function() onOpenProfile;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GridView.count(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.48,
      children: [
        _ActionCard(
          icon: Icons.receipt_long,
          title: 'Payments',
          subtitle: 'Receipts & alerts',
          color: scheme.primary,
          onTap: () => onNavigate(1),
        ),
        _ActionCard(
          icon: Icons.groups_outlined,
          title: 'Community',
          subtitle: 'News & association files',
          color: scheme.tertiary,
          onTap: () => onNavigate(2),
        ),
        _ActionCard(
          icon: Icons.apartment,
          title: 'My unit',
          subtitle: 'Unit & membership',
          color: scheme.secondary,
          onTap: () => onNavigate(3),
        ),
        _ActionCard(
          icon: Icons.health_and_safety_outlined,
          title: 'Emergency',
          subtitle: 'Dial safety contacts',
          color: Colors.deepOrange.shade700,
          onTap: () => onNavigate(4),
        ),
        _ActionCard(
          icon: Icons.person_outline,
          title: 'Profile',
          subtitle: 'Role & account details',
          color: scheme.tertiary,
          onTap: () {
            onOpenProfile();
          },
        ),
        _ActionCard(
          icon: Icons.refresh,
          title: 'Refresh',
          subtitle: 'Reload profile',
          color: scheme.primary,
          onTap: onRefresh,
        ),
      ],
    );
  }
}

class _ActionCard extends StatefulWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  State<_ActionCard> createState() => _ActionCardState();
}

class _ActionCardState extends State<_ActionCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapCancel: () => setState(() => _pressed = false),
      onTapUp: (_) => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        duration: const Duration(milliseconds: 120),
        scale: _pressed ? 0.98 : 1,
        child: Card(
          elevation: 0,
          color: scheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
            side: BorderSide(color: scheme.outlineVariant),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: widget.color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(widget.icon, color: widget.color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(widget.title, style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 2),
                      Text(
                        widget.subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      color: scheme.errorContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.error_outline, color: scheme.onErrorContainer),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                text,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: scheme.onErrorContainer),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
