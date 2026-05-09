import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:startupsage_app/main.dart';

void main() {
  testWidgets('StartupSage app renders home screen', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: StartupSageApp()));

    expect(find.text('StartupSage'), findsOneWidget);
    expect(find.text('Validate an idea'), findsOneWidget);
  });
}
