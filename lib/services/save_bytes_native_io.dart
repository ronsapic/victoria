import 'dart:io';

import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';

import 'dart:typed_data';

Future<void> saveBytesNative(Uint8List bytes, String filename) async {
  final dir = await getTemporaryDirectory();
  final safeName = filename.replaceAll(RegExp(r'[/\\]'), '_');
  final path = '${dir.path}/${DateTime.now().millisecondsSinceEpoch}_$safeName';
  await File(path).writeAsBytes(bytes);
  await OpenFile.open(path);
}
