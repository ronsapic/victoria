import 'dart:convert';

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
}
