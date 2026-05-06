import 'package:flutter/material.dart';

import '../../config/roles.dart';
import '../../services/api_service.dart';
import '../../services/local_file_opener.dart';
import '../../widgets/fade_slide.dart';

class NoticesScreen extends StatefulWidget {
  const NoticesScreen({
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
  State<NoticesScreen> createState() => _NoticesScreenState();
}

class _NoticesScreenState extends State<NoticesScreen> {
  List<DocumentEntryDto> _docs = [];
  String? _error;
  bool _loading = true;
  bool _uploading = false;

  final _titleCtrl = TextEditingController();
  String _docCategory = 'LEGAL';
  String _visibility = 'RESIDENTS';

  @override
  void dispose() {
    _titleCtrl.dispose();
    super.dispose();
  }

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
      final list = await widget.api.listDocuments();
      if (mounted) setState(() => _docs = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _uploadDocument() async {
    final title = _titleCtrl.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a document title')),
      );
      return;
    }
    setState(() => _uploading = true);
    try {
      final fileId = await widget.api.pickAndUploadDocument(
        visibility: _visibility,
      );
      await widget.api.registerDocument(
        fileId: fileId,
        title: title,
        category: _docCategory,
        visibility: _visibility,
      );
      _titleCtrl.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document published to the register')),
        );
      }
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _openDoc(DocumentEntryDto d) async {
    try {
      final bytes = await widget.api.fetchFileDownload(d.file.id);
      await openDownloadedBytes(bytes, d.file.originalName, mimeType: d.file.mimeType);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open file: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (widget.profileLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notices & documents')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    final role = widget.profile?['role']?.toString();
    final committee = isCommitteeRole(role);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notices & documents'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              FadeSlide(
                child: Text(
                  'Victoria Place Association',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: scheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Official notices, letters, and downloadable documents shared with residents.',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
              if (committee) ...[
                const SizedBox(height: 20),
                FadeSlide(
                  delay: const Duration(milliseconds: 40),
                  child: Card(
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
                            'Upload association document',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _titleCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Title',
                              hintText: 'e.g. AGM minutes',
                            ),
                          ),
                          const SizedBox(height: 12),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Category',
                                style: Theme.of(context).textTheme.labelLarge),
                          ),
                          const SizedBox(height: 6),
                          DropdownMenu<String>(
                            width: MediaQuery.sizeOf(context).width - 72,
                            initialSelection: _docCategory,
                            dropdownMenuEntries: const [
                              DropdownMenuEntry(value: 'LEGAL', label: 'Legal'),
                              DropdownMenuEntry(
                                  value: 'FINANCIAL', label: 'Financial'),
                              DropdownMenuEntry(
                                  value: 'MAINTENANCE',
                                  label: 'Maintenance'),
                              DropdownMenuEntry(value: 'OTHER', label: 'Other'),
                            ],
                            onSelected: (v) {
                              if (v != null) setState(() => _docCategory = v);
                            },
                          ),
                          const SizedBox(height: 12),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Resident access',
                                style: Theme.of(context).textTheme.labelLarge),
                          ),
                          const SizedBox(height: 6),
                          DropdownMenu<String>(
                            width: MediaQuery.sizeOf(context).width - 72,
                            initialSelection: _visibility,
                            dropdownMenuEntries: const [
                              DropdownMenuEntry(
                                value: 'RESIDENTS',
                                label: 'Residents can download',
                              ),
                              DropdownMenuEntry(
                                value: 'PRIVATE',
                                label: 'Committee / audit only',
                              ),
                            ],
                            onSelected: (v) {
                              if (v != null) setState(() => _visibility = v);
                            },
                          ),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            onPressed: _uploading ? null : _uploadDocument,
                            icon: _uploading
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.upload_file),
                            label: Text(_uploading ? 'Uploading…' : 'Choose file & publish'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Text(
                'Document register',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                Card(
                  color: scheme.errorContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(_error!, style: TextStyle(color: scheme.onErrorContainer)),
                  ),
                )
              else if (_docs.isEmpty)
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                    side: BorderSide(color: scheme.outlineVariant),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'No documents yet. Committee uploads appear here for residents when marked “Residents can download”.',
                    ),
                  ),
                )
              else
                ..._docs.asMap().entries.map((e) {
                  final d = e.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: FadeSlide(
                      delay: Duration(milliseconds: 40 + (e.key % 8) * 24),
                      child: Material(
                        color: scheme.surface,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: BorderSide(color: scheme.outlineVariant),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          title: Text(d.title),
                          subtitle: Text(
                            '${d.category} · ${_shortDate(d.createdAt)} · ${_kb(d.file.sizeBytes)}',
                          ),
                          trailing: Icon(Icons.download_rounded, color: scheme.primary),
                          onTap: () => _openDoc(d),
                        ),
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 12),
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
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  } catch (_) {
    return iso;
  }
}

String _kb(int bytes) {
  if (bytes < 1024) return '$bytes B';
  return '${(bytes / 1024).toStringAsFixed(1)} KB';
}
