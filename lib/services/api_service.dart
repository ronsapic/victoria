import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Uri _uri(String path) {
    final base = ApiConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$p');
  }

  Future<String?> _bearerToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;
    return user.getIdToken();
  }

  Future<Map<String, String>> _authHeaders() async {
    final token = await _bearerToken();
    if (token == null) throw Exception('Not signed in');
    return {'Authorization': 'Bearer $token'};
  }

  Future<Map<String, dynamic>> getProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('Not signed in');

    final token = await user.getIdToken();
    final res = await _client.get(
      _uri('/api/me'),
      headers: {'Authorization': 'Bearer $token'},
    );

    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    return body;
  }

  /// Multipart upload. [bytes] + [filename] for web; or use platform file path via picker.
  Future<String> uploadFile({
    Uint8List? bytes,
    String? filename,
    String? filePath,
    required String category,
    String visibility = 'PRIVATE',
  }) async {
    final headers = await _authHeaders();
    final uri = _uri('/api/files/upload');
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(headers);

    if (bytes != null && filename != null) {
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: filename,
        ),
      );
    } else if (filePath != null) {
      request.files.add(
        await http.MultipartFile.fromPath('file', filePath),
      );
    } else {
      throw ArgumentError('Provide bytes+filename or filePath');
    }

    request.fields['category'] = category;
    request.fields['visibility'] = visibility;

    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    final id = body['fileId']?.toString();
    if (id == null || id.isEmpty) {
      throw Exception('Missing fileId in response');
    }
    return id;
  }

  /// Document file for association register (committee upload); then call [registerDocument].
  Future<String> pickAndUploadDocument({
    required String visibility,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      withData: true,
    );
    if (result == null || result.files.isEmpty) {
      throw StateError('No file selected');
    }
    final f = result.files.single;
    final name = f.name;
    final data = f.bytes;
    final path = f.path;
    if (data != null) {
      return uploadFile(
        bytes: data,
        filename: name,
        category: 'DOCUMENT',
        visibility: visibility,
      );
    }
    if (path != null) {
      return uploadFile(
        filePath: path,
        category: 'DOCUMENT',
        visibility: visibility,
      );
    }
    throw StateError('Could not read file bytes');
  }

  Future<String> pickAndUploadReceipt() async {
    final result = await FilePicker.platform.pickFiles(
      withData: true,
    );
    if (result == null || result.files.isEmpty) {
      throw StateError('No file selected');
    }
    final f = result.files.single;
    if (f.bytes != null) {
      return uploadFile(
        bytes: f.bytes,
        filename: f.name,
        category: 'RECEIPT',
        visibility: 'PRIVATE',
      );
    }
    if (f.path != null) {
      return uploadFile(
        filePath: f.path,
        category: 'RECEIPT',
        visibility: 'PRIVATE',
      );
    }
    throw StateError('Could not read file bytes');
  }

  Future<void> registerDocument({
    required String fileId,
    required String title,
    required String category,
    required String visibility,
  }) async {
    final headers = await _authHeaders();
    headers['Content-Type'] = 'application/json';
    final res = await _client.post(
      _uri('/api/documents/entries'),
      headers: headers,
      body: jsonEncode({
        'fileId': fileId,
        'title': title,
        'category': category,
        'visibility': visibility,
      }),
    );
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
  }

  Future<List<DocumentEntryDto>> listDocuments() async {
    final headers = await _authHeaders();
    final res = await _client.get(_uri('/api/documents/entries'), headers: headers);
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    final list = body['entries'] as List<dynamic>? ?? [];
    return list
        .map((e) => DocumentEntryDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ReceiptDto>> listMyReceipts() async {
    final headers = await _authHeaders();
    final res = await _client.get(_uri('/api/receipts/me'), headers: headers);
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    final list = body['receipts'] as List<dynamic>? ?? [];
    return list
        .map((e) => ReceiptDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ReceiptAlertDto>> listReceiptAlerts() async {
    final headers = await _authHeaders();
    final res = await _client.get(
      _uri('/api/activity/receipt-alerts'),
      headers: headers,
    );
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    final list = body['alerts'] as List<dynamic>? ?? [];
    return list
        .map((e) => ReceiptAlertDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> deleteStoredFile(String fileId) async {
    final headers = await _authHeaders();
    final res = await _client.delete(
      _uri('/api/files/$fileId'),
      headers: headers,
    );
    if (res.statusCode == 401 || res.statusCode == 403 || res.statusCode == 404) {
      final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
          as Map<String, dynamic>;
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
          as Map<String, dynamic>;
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
  }

  Future<Uint8List> fetchFileDownload(String fileId) async {
    final headers = await _authHeaders();
    final res = await _client.get(
      _uri('/api/files/$fileId/download'),
      headers: headers,
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('HTTP ${res.statusCode}');
    }
    return res.bodyBytes;
  }

  Future<List<AnnouncementDto>> listAnnouncements() async {
    final headers = await _authHeaders();
    final res = await _client.get(_uri('/api/announcements'), headers: headers);
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    final list = body['announcements'] as List<dynamic>? ?? [];
    return list
        .map((e) => AnnouncementDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<EmergencyContactDto>> listEmergencyContacts() async {
    final headers = await _authHeaders();
    final res = await _client.get(
      _uri('/api/emergency-contacts'),
      headers: headers,
    );
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    final list = body['contacts'] as List<dynamic>? ?? [];
    return list
        .map((e) => EmergencyContactDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<UnitMembershipDto>> listMyUnits() async {
    final headers = await _authHeaders();
    final res = await _client.get(_uri('/api/units/me'), headers: headers);
    final body = jsonDecode(res.body.isEmpty ? '{}' : res.body)
        as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'HTTP ${res.statusCode}');
    }
    final list = body['memberships'] as List<dynamic>? ?? [];
    return list
        .map((e) => UnitMembershipDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

class DocumentEntryDto {
  DocumentEntryDto({
    required this.id,
    required this.title,
    required this.category,
    required this.visibility,
    required this.createdAt,
    required this.file,
  });

  final String id;
  final String title;
  final String category;
  final String visibility;
  final String createdAt;
  final DocumentFileDto file;

  static DocumentEntryDto fromJson(Map<String, dynamic> j) {
    return DocumentEntryDto(
      id: j['id']?.toString() ?? '',
      title: j['title']?.toString() ?? '',
      category: j['category']?.toString() ?? '',
      visibility: j['visibility']?.toString() ?? '',
      createdAt: j['createdAt']?.toString() ?? '',
      file: DocumentFileDto.fromJson(
        (j['file'] as Map?)?.cast<String, dynamic>() ?? {},
      ),
    );
  }
}

class DocumentFileDto {
  DocumentFileDto({
    required this.id,
    required this.originalName,
    required this.mimeType,
    required this.sizeBytes,
  });

  final String id;
  final String originalName;
  final String mimeType;
  final int sizeBytes;

  static DocumentFileDto fromJson(Map<String, dynamic> j) {
    return DocumentFileDto(
      id: j['id']?.toString() ?? '',
      originalName: j['originalName']?.toString() ?? '',
      mimeType: j['mimeType']?.toString() ?? '',
      sizeBytes: (j['sizeBytes'] as num?)?.toInt() ?? 0,
    );
  }
}

class ReceiptDto {
  ReceiptDto({
    required this.id,
    required this.originalName,
    required this.mimeType,
    required this.sizeBytes,
    required this.createdAt,
  });

  final String id;
  final String originalName;
  final String mimeType;
  final int sizeBytes;
  final String createdAt;

  static ReceiptDto fromJson(Map<String, dynamic> j) {
    return ReceiptDto(
      id: j['id']?.toString() ?? '',
      originalName: j['originalName']?.toString() ?? '',
      mimeType: j['mimeType']?.toString() ?? '',
      sizeBytes: (j['sizeBytes'] as num?)?.toInt() ?? 0,
      createdAt: j['createdAt']?.toString() ?? '',
    );
  }
}

class ReceiptAlertDto {
  ReceiptAlertDto({
    required this.id,
    required this.createdAt,
    required this.metadata,
    this.entityId,
  });

  final String id;
  final String createdAt;
  final String? entityId;
  final Map<String, dynamic>? metadata;

  static ReceiptAlertDto fromJson(Map<String, dynamic> j) {
    final meta = j['metadata'];
    return ReceiptAlertDto(
      id: j['id']?.toString() ?? '',
      createdAt: j['createdAt']?.toString() ?? '',
      entityId: j['entityId']?.toString(),
      metadata: meta is Map ? meta.cast<String, dynamic>() : null,
    );
  }
}

class AnnouncementDto {
  AnnouncementDto({
    required this.id,
    required this.title,
    required this.body,
    required this.audience,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String audience;
  final String createdAt;

  static AnnouncementDto fromJson(Map<String, dynamic> j) {
    return AnnouncementDto(
      id: j['id']?.toString() ?? '',
      title: j['title']?.toString() ?? '',
      body: j['body']?.toString() ?? '',
      audience: j['audience']?.toString() ?? '',
      createdAt: j['createdAt']?.toString() ?? '',
    );
  }
}

class EmergencyContactDto {
  EmergencyContactDto({
    required this.id,
    required this.label,
    required this.phone,
    required this.priority,
  });

  final String id;
  final String label;
  final String phone;
  final int priority;

  static EmergencyContactDto fromJson(Map<String, dynamic> j) {
    return EmergencyContactDto(
      id: j['id']?.toString() ?? '',
      label: j['label']?.toString() ?? '',
      phone: j['phone']?.toString() ?? '',
      priority: (j['priority'] as num?)?.toInt() ?? 0,
    );
  }
}

class UnitSummaryDto {
  UnitSummaryDto({
    required this.id,
    required this.number,
    required this.floor,
    this.sizeSqm,
    required this.ownershipSharePct,
  });

  final String id;
  final String number;
  final int floor;
  final double? sizeSqm;
  final double ownershipSharePct;

  static UnitSummaryDto fromJson(Map<String, dynamic> j) {
    return UnitSummaryDto(
      id: j['id']?.toString() ?? '',
      number: j['number']?.toString() ?? '',
      floor: (j['floor'] as num?)?.toInt() ?? 0,
      sizeSqm: (j['sizeSqm'] as num?)?.toDouble(),
      ownershipSharePct: (j['ownershipSharePct'] as num?)?.toDouble() ?? 100,
    );
  }
}

class UnitMembershipDto {
  UnitMembershipDto({
    required this.id,
    required this.kind,
    required this.startDate,
    required this.endDate,
    required this.unit,
  });

  final String id;
  final String kind;
  final String startDate;
  final String? endDate;
  final UnitSummaryDto unit;

  static UnitMembershipDto fromJson(Map<String, dynamic> j) {
    return UnitMembershipDto(
      id: j['id']?.toString() ?? '',
      kind: j['kind']?.toString() ?? '',
      startDate: j['startDate']?.toString() ?? '',
      endDate: j['endDate']?.toString(),
      unit: UnitSummaryDto.fromJson(
        (j['unit'] as Map?)?.cast<String, dynamic>() ?? {},
      ),
    );
  }
}
