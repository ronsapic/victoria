import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

/// Calls Next.js `/api/*` routes with Firebase ID tokens (see `Authorization: Bearer` in `session.ts`).
class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Uri _uri(String path) {
    final base = ApiConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$p');
  }

  Future<Map<String, dynamic>> getProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception('Not signed in');
    }
    final token = await user.getIdToken();
    final res = await _client.get(
      _uri('/api/me'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    final body =
        jsonDecode(res.body.isEmpty ? '{}' : res.body) as Map<String, dynamic>;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final msg = body['error']?.toString() ?? 'HTTP ${res.statusCode}';
      throw Exception(msg);
    }
    return body;
  }
}
