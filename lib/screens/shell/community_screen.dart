import 'package:flutter/material.dart';

import '../../config/roles.dart';
import '../../services/api_service.dart';
import '../../services/local_file_opener.dart';
import '../../widgets/fade_slide.dart';

/// Announcements plus document register — replaces the old notices-only tab.
class CommunityScreen extends StatelessWidget {
  const CommunityScreen({
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
  Widget build(BuildContext context) {
    if (profileLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Community')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final role = profile?['role']?.toString();
    final committee = isCommitteeRole(role);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Community'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Announcements'),
              Tab(text: 'Documents'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _AnnouncementsPane(api: api, onNavigate: onNavigate),
            _DocumentsPane(
              api: api,
              committee: committee,
              admin: isAdminRole(role),
              onNavigate: onNavigate,
            ),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementsPane extends StatefulWidget {
  const _AnnouncementsPane({
    required this.api,
    required this.onNavigate,
  });

  final ApiService api;
  final ValueChanged<int> onNavigate;

  @override
  State<_AnnouncementsPane> createState() => _AnnouncementsPaneState();
}

class _AnnouncementsPaneState extends State<_AnnouncementsPane> {
  List<AnnouncementDto> _items = [];
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
      final list = await widget.api.listAnnouncements();
      if (mounted) setState(() => _items = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Victoria Place Association announcements from the committee and management.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
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
          else if (_items.isEmpty)
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
                side: BorderSide(color: scheme.outlineVariant),
              ),
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Text('No announcements yet. Pull to refresh.'),
              ),
            )
          else
            ..._items.asMap().entries.map((e) {
              final a = e.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: FadeSlide(
                  delay: Duration(milliseconds: 30 + (e.key % 6) * 20),
                  child: Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(color: scheme.outlineVariant),
                    ),
                    child: ExpansionTile(
                      initiallyExpanded: e.key == 0,
                      title: Text(
                        a.title,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      subtitle: Text(
                        '${_fmtDate(a.createdAt)} · Audience: ${a.audience}',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: scheme.onSurfaceVariant),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              a.body,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => widget.onNavigate(0),
            icon: const Icon(Icons.dashboard_outlined),
            label: const Text('Back to dashboard'),
          ),
        ],
      ),
    );
  }
}

class _DocumentsPane extends StatefulWidget {
  const _DocumentsPane({
    required this.api,
    required this.committee,
    required this.admin,
    required this.onNavigate,
  });

  final ApiService api;
  final bool committee;
  final bool admin;
  final ValueChanged<int> onNavigate;

  @override
  State<_DocumentsPane> createState() => _DocumentsPaneState();
}

class _DocumentsPaneState extends State<_DocumentsPane> {
  DocumentCatalog? _catalog;
  String? _error;
  bool _loading = true;
  bool _uploading = false;
  String _segment = 'ALL';

  final _titleCtrl = TextEditingController();
  final _seriesKeyCtrl = TextEditingController();
  final _versionNoteCtrl = TextEditingController();
  String _docCategory = 'LEGAL';
  String _visibility = 'RESIDENTS';

  static const List<String> _presetSegments = [
    'ALL',
    'MANAGEMENT',
    'LEGAL',
    'FINANCIAL',
    'MAINTENANCE',
    'OTHER',
  ];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _seriesKeyCtrl.dispose();
    _versionNoteCtrl.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  List<String> get _segmentsChips {
    final fromApi = _catalog?.segments ?? [];
    final set = {..._presetSegments, ...fromApi};
    final list = set.toList();
    list.sort(_segmentSort);
    if (!list.contains('ALL')) list.insert(0, 'ALL');
    return list;
  }

  int _segmentSort(String a, String b) {
    const order = {'ALL': 0, 'MANAGEMENT': 1, 'LEGAL': 2, 'FINANCIAL': 3, 'MAINTENANCE': 4, 'OTHER': 5};
    final ia = order[a] ?? 100;
    final ib = order[b] ?? 100;
    if (ia != ib) return ia.compareTo(ib);
    return a.compareTo(b);
  }

  List<DocumentSeriesDto> get _filteredSeries {
    final all = _catalog?.series ?? [];
    if (_segment == 'ALL') {
      final copy = [...all]..sort(_seriesSort);
      return copy;
    }
    final sub = all.where((s) => s.category == _segment).toList();
    sub.sort(_seriesSort);
    return sub;
  }

  int _seriesSort(DocumentSeriesDto a, DocumentSeriesDto b) {
    final pa = a.category == 'MANAGEMENT' ? 0 : 1;
    final pb = b.category == 'MANAGEMENT' ? 0 : 1;
    if (pa != pb) return pa.compareTo(pb);
    return a.displayTitle.compareTo(b.displayTitle);
  }

  List<DocumentEntryDto> get _filteredStandalone {
    final all = _catalog?.entries ?? [];
    return all.where((e) {
      final sk = e.seriesKey?.trim() ?? '';
      if (sk.isNotEmpty) return false;
      if (_segment == 'ALL') return true;
      return e.category == _segment;
    }).toList();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final cat = await widget.api.loadDocumentCatalog();
      if (mounted) setState(() => _catalog = cat);
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
    if (_docCategory == 'MANAGEMENT' && !widget.admin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Only admins can upload management documents')),
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
        seriesKey: _seriesKeyCtrl.text.trim().isEmpty ? null : _seriesKeyCtrl.text.trim(),
        versionNote: _versionNoteCtrl.text.trim().isEmpty ? null : _versionNoteCtrl.text.trim(),
      );
      _titleCtrl.clear();
      _seriesKeyCtrl.clear();
      _versionNoteCtrl.clear();
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

  List<DropdownMenuEntry<String>> get _categoryMenuEntries {
    final base = <DropdownMenuEntry<String>>[
      const DropdownMenuEntry(value: 'LEGAL', label: 'Legal'),
      const DropdownMenuEntry(value: 'FINANCIAL', label: 'Financial'),
      const DropdownMenuEntry(value: 'MAINTENANCE', label: 'Maintenance'),
      const DropdownMenuEntry(value: 'OTHER', label: 'Other'),
    ];
    if (widget.admin) {
      return [
        const DropdownMenuEntry(
          value: 'MANAGEMENT',
          label: 'Management (global)',
        ),
        ...base,
      ];
    }
    return base;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Management postings from admins appear under Management — use the same document key '
            'for each new file to keep a public revision history.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
          ),
          if (widget.committee) ...[
            const SizedBox(height: 18),
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
                      widget.admin
                          ? 'Upload document'
                          : 'Upload association document',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _titleCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Title',
                        hintText: 'e.g. AGM minutes · Management reporting pack',
                      ),
                    ),
                    if (widget.admin) ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: _seriesKeyCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Document key (optional, for revision history)',
                          hintText: 'e.g. management-fee-guidance — reuse for updates',
                          helperText:
                              'Same key groups uploads so everyone sees past versions globally.',
                        ),
                        autocorrect: false,
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _versionNoteCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Version note (optional)',
                          hintText: 'e.g. Revised Q2 2026',
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child:
                          Text('Category', style: Theme.of(context).textTheme.labelLarge),
                    ),
                    const SizedBox(height: 6),
                    DropdownMenu<String>(
                      width: MediaQuery.sizeOf(context).width - 72,
                      initialSelection: _docCategory,
                      dropdownMenuEntries: _categoryMenuEntries,
                      onSelected: (v) {
                        if (v != null) {
                          setState(() {
                            _docCategory = v;
                            if (v == 'MANAGEMENT') {
                              _visibility = 'RESIDENTS';
                            }
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child:
                          Text('Resident access', style: Theme.of(context).textTheme.labelLarge),
                    ),
                    const SizedBox(height: 6),
                    DropdownMenu<String>(
                      width: MediaQuery.sizeOf(context).width - 72,
                      initialSelection: _visibility,
                      dropdownMenuEntries: const [
                        DropdownMenuEntry(
                          value: 'RESIDENTS',
                          label: 'Residents can download (global)',
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
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.upload_file),
                      label: Text(_uploading ? 'Uploading…' : 'Choose file & publish'),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 20),
          Text('Browse by segment', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 10),
          if (!_loading && _catalog != null)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final seg in _segmentsChips)
                  FilterChip(
                    label: Text(_segmentChipLabel(seg)),
                    selected: _segment == seg,
                    onSelected: (_) => setState(() => _segment = seg),
                  ),
              ],
            ),
          const SizedBox(height: 18),
          Text(
            _segment == 'ALL' ? 'All register items' : 'Segment: ${_segmentChipLabel(_segment)}',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 10),
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
          else ...[
            if (_filteredSeries.isNotEmpty) ...[
              Text(
                'Versioned documents',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 8),
              ..._filteredSeries.asMap().entries.map((e) {
                final g = e.value;
                final n = g.versions.length;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: FadeSlide(
                    delay: Duration(milliseconds: 30 + e.key % 5 * 30),
                    child: Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(color: scheme.outlineVariant),
                      ),
                      child: ExpansionTile(
                        leading: Icon(
                          g.category == 'MANAGEMENT'
                              ? Icons.admin_panel_settings_outlined
                              : Icons.folder_copy_outlined,
                          color: scheme.primary,
                        ),
                        title: Text(g.displayTitle),
                        subtitle: Text(
                          '${g.category} · $n version${n == 1 ? '' : 's'} · key ${g.seriesKey}',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: scheme.onSurfaceVariant,
                                  ),
                        ),
                        children: [
                          for (final v in g.versions)
                            ListTile(
                              dense: true,
                              title: Text(v.title),
                              subtitle: Text(
                                [
                                  if (v.versionNote != null &&
                                      v.versionNote!.trim().isNotEmpty)
                                    v.versionNote!.trim(),
                                  '${_shortDateDoc(v.createdAt)} · ${_kb(v.file.sizeBytes)}',
                                  v.visibility == 'PRIVATE' ? 'Private' : 'Residents',
                                ].where((x) => x.isNotEmpty).join(' · '),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: scheme.onSurfaceVariant,
                                    ),
                              ),
                              trailing:
                                  Icon(Icons.download_rounded, color: scheme.primary),
                              onTap: () => _openDoc(v),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
            ],
            if (_filteredStandalone.isNotEmpty) ...[
              Text(
                'Single-file entries',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 8),
              ..._filteredStandalone.asMap().entries.map((e) {
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
                          '${d.category} · ${_shortDateDoc(d.createdAt)} · ${_kb(d.file.sizeBytes)} · ${d.visibility}',
                        ),
                        trailing:
                            Icon(Icons.download_rounded, color: scheme.primary),
                        onTap: () => _openDoc(d),
                      ),
                    ),
                  ),
                );
              }),
            ],
            if (_filteredSeries.isEmpty && _filteredStandalone.isEmpty && _catalog != null)
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(color: scheme.outlineVariant),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    _segment == 'ALL'
                        ? 'No documents yet.'
                        : 'Nothing in this segment yet — try another filter.',
                  ),
                ),
              ),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => widget.onNavigate(0),
            icon: const Icon(Icons.dashboard_outlined),
            label: const Text('Back to dashboard'),
          ),
        ],
      ),
    );
  }
}

String _segmentChipLabel(String code) {
  switch (code) {
    case 'ALL':
      return 'All';
    case 'MANAGEMENT':
      return 'Management';
    case 'LEGAL':
      return 'Legal';
    case 'FINANCIAL':
      return 'Finance';
    case 'MAINTENANCE':
      return 'Maintenance';
    case 'OTHER':
      return 'Other';
    default:
      return code;
  }
}

String _fmtDate(String iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} '
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return iso;
  }
}

String _shortDateDoc(String iso) {
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
