import 'package:flutter/widgets.dart';

class FadeSlide extends StatelessWidget {
  const FadeSlide({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 420),
    this.offset = const Offset(0, 0.08),
    this.curve = Curves.easeOutCubic,
  });

  final Widget child;
  final Duration delay;
  final Duration duration;
  final Offset offset;
  final Curve curve;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: duration + delay,
      curve: curve,
      builder: (context, t, _) {
        final appear = delay == Duration.zero
            ? t
            : ((t - (delay.inMilliseconds / (duration.inMilliseconds + delay.inMilliseconds)))
                    .clamp(0.0, 1.0))
                .toDouble();

        return Opacity(
          opacity: appear,
          child: Transform.translate(
            offset: Offset(offset.dx * (1 - appear), offset.dy * (1 - appear)) * 100,
            child: child,
          ),
        );
      },
    );
  }
}

