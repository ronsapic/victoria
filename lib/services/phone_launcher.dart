import 'package:url_launcher/url_launcher.dart';

/// Opens the dialer on mobile; fails gracefully on unsupported platforms.
Future<bool> dialPhone(String raw) async {
  final digits = raw.replaceAll(RegExp(r'[^\d+]'), '');
  if (digits.isEmpty) return false;
  final uri = Uri.parse('tel:$digits');
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
