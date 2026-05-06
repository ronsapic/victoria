import 'dart:typed_data';

import 'package:file_saver/file_saver.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import 'save_bytes_native_stub.dart'
    if (dart.library.io) 'save_bytes_native_io.dart' as native;

String _extension(String name) {
  final i = name.lastIndexOf('.');
  if (i < 0 || i >= name.length - 1) return '';
  return name.substring(i + 1).toLowerCase();
}

String _guessMime(String ext) {
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/// Saves bytes to a temp file and opens it (Android/iOS/desktop), or triggers download (web).
Future<void> openDownloadedBytes(
  Uint8List bytes,
  String filename, {
  String? mimeType,
}) async {
  final ext = _extension(filename);
  final safeBase = filename.replaceAll(RegExp(r'[/\\]'), '_');

  if (kIsWeb) {
    await FileSaver.instance.saveFile(
      name: safeBase,
      bytes: bytes,
      ext: ext,
      mimeType: MimeType.custom,
      customMimeType: mimeType ?? _guessMime(ext),
    );
    return;
  }

  await native.saveBytesNative(bytes, safeBase);
}
