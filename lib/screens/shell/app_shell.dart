import 'package:flutter/material.dart';

import '../../services/api_service.dart';
import '../home_screen.dart';
import 'notices_screen.dart';
import 'payments_screen.dart';
import 'unit_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.api});

  final ApiService api;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  Map<String, dynamic>? _profile;
  bool _profileLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _profileLoading = true);
    try {
      final p = await widget.api.getProfile();
      if (mounted) setState(() => _profile = p);
    } catch (_) {
      if (mounted) setState(() => _profile = null);
    } finally {
      if (mounted) setState(() => _profileLoading = false);
    }
  }

  void _setIndex(int next) {
    if (next == _index) return;
    setState(() => _index = next);
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      HomeScreen(api: widget.api, onNavigate: _setIndex),
      PaymentsScreen(
        api: widget.api,
        profile: _profile,
        profileLoading: _profileLoading,
        onNavigate: _setIndex,
      ),
      NoticesScreen(
        api: widget.api,
        profile: _profile,
        profileLoading: _profileLoading,
        onNavigate: _setIndex,
      ),
      UnitScreen(onNavigate: _setIndex),
    ];

    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 260),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (child, anim) {
          final offset = Tween<Offset>(
            begin: const Offset(0.02, 0),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic));
          return FadeTransition(
            opacity: anim,
            child: SlideTransition(position: offset, child: child),
          );
        },
        child: KeyedSubtree(
          key: ValueKey(_index),
          child: pages[_index],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _setIndex,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Payments',
          ),
          NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            selectedIcon: Icon(Icons.campaign),
            label: 'Notices',
          ),
          NavigationDestination(
            icon: Icon(Icons.apartment_outlined),
            selectedIcon: Icon(Icons.apartment),
            label: 'My Unit',
          ),
        ],
      ),
    );
  }
}
