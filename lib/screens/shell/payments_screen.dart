import 'package:flutter/material.dart';

import '../../config/roles.dart';
import '../../services/api_service.dart';
import '../../services/local_file_opener.dart';
import '../../widgets/fade_slide.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({
    super.key,
    required this.api,
    required this.profile,
    required this.profileLoading,
    required this.onNavigate,
  });

  final ApiService api;
  final Map<String, dynamic>? profile;
  final bool profileLoading;
  final ValueChanged<int> onNavigate;

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  List<ReceiptDto> _receipts = [];
  List<ReceiptAlertDto> _alerts = [];
  String? _error;
  String? _alertError;
  bool _loading = true;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _alertError = null;
    });

    final role = widget.profile?['role']?.toString();
    final showAlerts = seesReceiptUploadAlerts(role);

    try {
      if (isResident(role)) {
        final list = await widget.api.listMyReceipts();
        if (mounted) setState(() => _receipts = list);
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }

    if (showAlerts) {
      try {
        final a = await widget.api.listReceiptAlerts();
        if (mounted) setState(() => _alerts = a);
      } catch (e) {
        if (mounted) setState(() => _alertError = e.toString());
      }
    }

    if (mounted) setState(() => _loading = false);
  }

  Future<void> _uploadReceipt() async {
    setState(() => _uploading = true);
    try {
      await widget.api.pickAndUploadReceipt();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Receipt uploaded. Committee and caretakers are notified in the activity log.',
            ),
          ),
        );
      }
      await _load();
    } catch (e) {
      if (e is StateError && e.message == 'No file selected') {
        // picker cancelled
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _openReceipt(ReceiptDto r) async {
    try {
      final bytes = await widget.api.fetchFileDownload(r.id);
      await openDownloadedBytes(bytes, r.originalName, mimeType: r.mimeType);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  Future<void> _deleteReceipt(ReceiptDto r) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove receipt?'),
        content: Text('Remove “${r.originalName}” from your history?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    try {
      await widget.api.deleteStoredFile(r.id);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Receipt removed')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (widget.profileLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Payments')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    final role = widget.profile?['role']?.toString();
    final resident = isResident(role);
    final showAlerts = seesReceiptUploadAlerts(role);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              FadeSlide(
                child: Text(
                  'Service charges & receipts',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: scheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Residents can upload payment proofs. Uploads notify admin, finance, and caretaker staff.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
              if (showAlerts) ...[
                const SizedBox(height: 16),
                Text(
                  'Recent resident receipt uploads',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                if (_alertError != null)
                  Text(_alertError!, style: TextStyle(color: scheme.error))
                else if (_alerts.isEmpty)
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                      side: BorderSide(color: scheme.outlineVariant),
                    ),
                    child: const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('No uploads in the log yet.'),
                    ),
                  )
                else
                  ..._alerts.take(12).map(
                        (a) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(color: scheme.outlineVariant),
                          ),
                          child: ListTile(
                            leading:
                                Icon(Icons.notifications_active, color: scheme.primary),
                            title: Text(
                              a.metadata?['originalName']?.toString() ?? 'Receipt',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Text(
                              '${a.metadata?['uploadedByEmail'] ?? 'Resident'} · ${_shortDate(a.createdAt)}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ),
              ],
              if (resident) ...[
                const SizedBox(height: 20),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                    side: BorderSide(color: scheme.outlineVariant),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Your receipt history',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Upload a bank or mobile-money receipt. You can remove a mistaken upload anytime.',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: scheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 12),
                        FilledButton.icon(
                          onPressed: _uploading ? null : _uploadReceipt,
                          icon: _uploading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.add_photo_alternate_outlined),
                          label: Text(_uploading ? 'Uploading…' : 'Upload receipt'),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(_error!, style: TextStyle(color: scheme.error)),
                  )
                else if (_receipts.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Text('No receipts uploaded yet.'),
                  )
                else
                  ..._receipts.map(
                    (r) => Card(
                      margin: const EdgeInsets.only(top: 10),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(color: scheme.outlineVariant),
                      ),
                      child: ListTile(
                        title:
                            Text(r.originalName, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(_shortDate(r.createdAt)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              tooltip: 'Open',
                              icon: const Icon(Icons.open_in_new),
                              onPressed: () => _openReceipt(r),
                            ),
                            IconButton(
                              tooltip: 'Remove',
                              icon: Icon(Icons.delete_outline, color: scheme.error),
                              onPressed: () => _deleteReceipt(r),
                            ),
                          ],
                        ),
                        onTap: () => _openReceipt(r),
                      ),
                    ),
                  ),
              ] else if (!resident && !showAlerts) ...[
                const SizedBox(height: 16),
                Card(
                  elevation: 0,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Receipt uploads are for resident accounts. '
                      'Use the alerts above if your role includes receipt monitoring.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => widget.onNavigate(0),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Back to dashboard'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _shortDate(String iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} '
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return iso;
  }
}
