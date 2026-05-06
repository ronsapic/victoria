import 'package:flutter/material.dart';

/// Brand mark from `assets/branding/association_logo.png`
/// (maintainer copy of `logo vp.png` at the repo root).
class VpAssociationLogo extends StatelessWidget {
  const VpAssociationLogo({
    super.key,
    this.height = 56,
    this.width,
    this.fit = BoxFit.contain,
    this.borderRadius,
  });

  final double height;
  final double? width;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  static const String assetPath = 'assets/branding/association_logo.png';

  @override
  Widget build(BuildContext context) {
    Widget img = SizedBox(
      height: height,
      width: width,
      child: Image.asset(
        assetPath,
        fit: fit,
        filterQuality: FilterQuality.high,
        semanticLabel: 'Victoria Place Association logo',
        errorBuilder: (context, error, stackTrace) =>
            Icon(Icons.apartment_rounded, size: height * 0.75),
      ),
    );
    if (borderRadius != null) {
      img = ClipRRect(borderRadius: borderRadius!, child: img);
    }
    return img;
  }
}
