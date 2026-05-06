import 'package:flutter/material.dart';

import '../../services/api_service.dart';
import '../../widgets/fade_slide.dart';

class UnitScreen extends StatefulWidget {
  const UnitScreen({
    super.key,
    required this.api,
    required this.profileLoading,
    required this.onNavigate,
  });

  final ApiService api;
  final bool profileLoading;
  final ValueChanged<int> onNavigate;

  @override
  State<UnitScreen> createState() => _UnitScreenState();
}

class _UnitScreenState extends State<UnitScreen> {
  List<UnitMembershipDto>? _memberships;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (widget.profileLoading) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await widget.api.listMyUnits();
      if (mounted) setState(() => _memberships = rows);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void didUpdateWidget(UnitScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profileLoading && !widget.profileLoading && _memberships == null) {
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    if (widget.profileLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('My unit')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My unit'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Your active estate registrations with Victoria Place Association.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
              const SizedBox(height: 14),
              if (_loading && _memberships == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
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
              else if (_memberships == null || _memberships!.isEmpty)
                FadeSlide(
                  child: Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                      side: BorderSide(color: scheme.outlineVariant),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'No unit on file',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Your account does not yet have an active owner or tenant linkage. '
                            'Contact committee or caretaker staff to associate your Firebase login with a unit.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: scheme.onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ..._memberships!.asMap().entries.map((e) {
                  final m = e.value;
                  final u = m.unit;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: FadeSlide(
                      delay: Duration(milliseconds: 40 + e.key * 30),
                      child: Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22),
                          side: BorderSide(color: scheme.outlineVariant),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 52,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      color: scheme.primary.withValues(alpha: 0.14),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child:
                                        Icon(Icons.apartment_rounded, color: scheme.primary),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Unit ${u.number}',
                                          style:
                                              Theme.of(context).textTheme.titleMedium,
                                        ),
                                        Text(
                                          _kindReadable(m.kind),
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                                color: scheme.onSurfaceVariant,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 28),
                              _InfoRow(Icons.layers_outlined,
                                  'Floor', u.floor.toString()),
                              _InfoRow(
                                Icons.aspect_ratio_outlined,
                                'Size (approx.)',
                                u.sizeSqm != null
                                    ? '${u.sizeSqm!.toStringAsFixed(1)} m²'
                                    : '—',
                              ),
                              _InfoRow(
                                Icons.percent_outlined,
                                'Ownership share',
                                '${u.ownershipSharePct.toStringAsFixed(1)}%',
                              ),
                              _InfoRow(
                                Icons.event_outlined,
                                'Membership from',
                                _shortDatePlain(m.startDate),
                              ),
                              if (m.endDate != null)
                                _InfoRow(
                                  Icons.event_busy_outlined,
                                  'Ends',
                                  _shortDatePlain(m.endDate!),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 10),
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

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.label, this.value);

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: scheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                ),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String _kindRaw(String raw) => raw.trim().toUpperCase();

String _kindReadable(String kind) {
  final k = _kindRaw(kind);
  if (k.contains('OWNER')) return 'Registered as owner';
  if (k.contains('TENANT')) return 'Registered as tenant';
  return 'Membership · $kind';
}

String _shortDatePlain(String iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  } catch (_) {
    return iso;
  }
}
