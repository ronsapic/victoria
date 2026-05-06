import 'package:flutter/material.dart';

import '../../services/api_service.dart';
import '../../services/phone_launcher.dart';
import '../../widgets/fade_slide.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({
    super.key,
    required this.api,
    required this.onNavigate,
  });

  final ApiService api;
  final ValueChanged<int> onNavigate;

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  List<EmergencyContactDto> _contacts = [];
  bool _loading = true;
  String? _error;

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
      final list = await widget.api.listEmergencyContacts();
      if (mounted) setState(() => _contacts = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency & safety'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              FadeSlide(
                child: Card(
                  elevation: 0,
                  color: scheme.error.withValues(alpha: 0.12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.warning_amber_rounded, color: scheme.error),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Life-threatening emergencies: call national emergency services first, then '
                            'notify estates security once it is safe to do so.',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Victoria Place compiled contacts — tap to call from your phone.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
              const SizedBox(height: 14),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 36),
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
              else if (_contacts.isEmpty)
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                    side: BorderSide(color: scheme.outlineVariant),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'No estate-specific numbers uploaded yet.',
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Ask your committee or caretaker to add rows in EmergencyContact (legacy admin), '
                          'or dial your building concierge from your roster.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: scheme.onSurfaceVariant,
                              ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ..._contacts.asMap().entries.map((e) {
                  final c = e.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: FadeSlide(
                      delay: Duration(milliseconds: 36 + e.key * 26),
                      child: Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: BorderSide(color: scheme.outlineVariant),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 10,
                          ),
                          title: Text(c.label),
                          subtitle: Text(c.phone),
                          trailing: Icon(Icons.phone_in_talk, color: scheme.primary),
                          onTap: () async {
                            final ok = await dialPhone(c.phone);
                            if (!context.mounted) return;
                            if (!ok) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Calling is not supported on this device.'),
                                ),
                              );
                            }
                          },
                        ),
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: () => widget.onNavigate(0),
                icon: const Icon(Icons.dashboard_outlined),
                label: const Text('Back to dashboard'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
