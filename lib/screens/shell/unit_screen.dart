import 'package:flutter/material.dart';

class UnitScreen extends StatelessWidget {
  const UnitScreen({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('My Unit', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'Unit membership, occupants, and details.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: scheme.outlineVariant),
            ),
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Coming next: unit number, membership, vehicles, and contacts.'),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => onNavigate(0),
            icon: const Icon(Icons.arrow_back),
            label: const Text('Back to dashboard'),
          ),
        ],
      ),
    );
  }
}

