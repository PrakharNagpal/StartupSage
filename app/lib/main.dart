import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

void main() {
  runApp(const ProviderScope(child: StartupSageApp()));
}

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://127.0.0.1:8000',
);

final appControllerProvider = ChangeNotifierProvider<AppController>((ref) {
  return AppController(ApiClient(apiBaseUrl));
});

class StartupSageApp extends StatelessWidget {
  const StartupSageApp({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = ColorScheme.fromSeed(
      seedColor: const Color(0xff00a6a6),
      brightness: Brightness.dark,
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'StartupSage',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: scheme,
        scaffoldBackgroundColor: const Color(0xff111318),
        textTheme: ThemeData.dark().textTheme.apply(
              bodyColor: const Color(0xffedf1f7),
              displayColor: const Color(0xfff8fafc),
            ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xff191d24),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xff2a303a)),
          ),
        ),
      ),
      routes: {
        '/': (_) => const HomeScreen(),
        '/submit': (_) => const SubmitIdeaScreen(),
        '/live': (_) => const LiveSessionScreen(),
        '/report': (_) => const ReportScreen(),
      },
    );
  }
}

class ApiClient {
  ApiClient(String baseUrl)
      : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 4),
            receiveTimeout: const Duration(seconds: 30),
          ),
        );

  final Dio _dio;

  Future<SessionCreated> createSession(String idea) async {
    final response = await _dio.post('/sessions', data: {'idea': idea});
    return SessionCreated.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ReportData> getReport(String sessionId) async {
    final response = await _dio.get('/sessions/$sessionId/report');
    return ReportData.fromJson(response.data as Map<String, dynamic>);
  }

  Stream<SageToken> streamConversation(String sessionId) async* {
    final response = await _dio.get<ResponseBody>(
      '/sessions/$sessionId/stream',
      options: Options(responseType: ResponseType.stream),
    );
    var buffer = '';
    var event = 'message';

    await for (final chunk in response.data!.stream) {
      buffer += utf8.decode(chunk);
      while (buffer.contains('\n')) {
        final index = buffer.indexOf('\n');
        final line = buffer.substring(0, index).trimRight();
        buffer = buffer.substring(index + 1);

        if (line.startsWith('event:')) {
          event = line.substring(6).trim();
        } else if (line.startsWith('data:') && event == 'token') {
          final data = jsonDecode(line.substring(5).trim()) as Map<String, dynamic>;
          yield SageToken.fromJson(data);
        }
      }
    }
  }
}

class AppController extends ChangeNotifier {
  AppController(this._api);

  final ApiClient _api;
  String? sessionId;
  String idea = '';
  bool loading = false;
  String? error;
  List<SagePersona> sages = demoSages;
  final List<ChatMessage> messages = [];
  ReportData? report;

  Future<void> submitIdea(String value) async {
    loading = true;
    error = null;
    idea = value;
    messages.clear();
    notifyListeners();

    try {
      final created = await _api.createSession(value);
      sessionId = created.sessionId;
      sages = created.sages;
    } catch (_) {
      sessionId = null;
      sages = demoSages;
      messages.add(
        const ChatMessage(
          role: MessageRole.system,
          text: 'Backend unavailable. Running the phase 0 offline demo stream.',
        ),
      );
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> startConversation() async {
    if (messages.any((message) => message.role == MessageRole.sage)) return;
    messages.add(ChatMessage(role: MessageRole.user, text: idea));
    notifyListeners();

    if (sessionId == null) {
      await _runOfflineConversation();
      return;
    }

    try {
      await for (final token in _api.streamConversation(sessionId!)) {
        _appendToken(token);
      }
    } catch (_) {
      error = 'Live stream failed. Showing baseline local sage questions.';
      notifyListeners();
      await _runOfflineConversation();
    }
  }

  Future<void> loadReport() async {
    loading = true;
    notifyListeners();
    try {
      report = sessionId == null ? demoReport(idea) : await _api.getReport(sessionId!);
    } catch (_) {
      report = demoReport(idea);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void _appendToken(SageToken token) {
    final last = messages.isNotEmpty ? messages.last : null;
    if (last == null || last.sageKey != token.sageKey) {
      messages.add(ChatMessage(role: MessageRole.sage, sageKey: token.sageKey, text: token.token));
    } else {
      messages[messages.length - 1] = last.copyWith(text: last.text + token.token);
    }
    notifyListeners();
  }

  Future<void> _runOfflineConversation() async {
    final scripts = <SageToken>[
      const SageToken(
        sageKey: 'distribution',
        sageName: 'The Distribution Skeptic',
        token: 'Who discovers this repeatedly without paid acquisition swallowing the margin?',
      ),
      const SageToken(
        sageKey: 'timing',
        sageName: 'The Timing Realist',
        token: 'What changed in the market that makes this urgent now?',
      ),
      const SageToken(
        sageKey: 'economics',
        sageName: 'The Unit Economics Hawk',
        token: 'What does the payback period look like when support and churn are included?',
      ),
    ];
    for (final script in scripts) {
      messages.add(ChatMessage(role: MessageRole.sage, sageKey: script.sageKey, text: script.token));
      notifyListeners();
      await Future<void>.delayed(const Duration(milliseconds: 450));
    }
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Spacer(),
          Text('StartupSage', style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Text(
            'Adversarial idea validation from failed-founder sages.',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: const Color(0xffb8c0cc)),
          ),
          const SizedBox(height: 32),
          FilledButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/submit'),
            icon: const Icon(Icons.bolt),
            label: const Text('Validate an idea'),
          ),
          const Spacer(),
          const _StatusStrip(),
        ],
      ),
    );
  }
}

class SubmitIdeaScreen extends ConsumerStatefulWidget {
  const SubmitIdeaScreen({super.key});

  @override
  ConsumerState<SubmitIdeaScreen> createState() => _SubmitIdeaScreenState();
}

class _SubmitIdeaScreenState extends ConsumerState<SubmitIdeaScreen> {
  final controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appControllerProvider);

    return AppShell(
      title: 'Submit Idea',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller,
            minLines: 8,
            maxLines: 12,
            decoration: const InputDecoration(
              hintText: 'Example: A lightweight finance copilot for solo founders that turns receipts, invoices, and bank transactions into weekly runway decisions.',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text('${controller.text.length}/4000', style: const TextStyle(color: Color(0xff9aa4b2))),
              const Spacer(),
              FilledButton.icon(
                onPressed: state.loading
                    ? null
                    : () async {
                        final idea = controller.text.trim();
                        if (idea.length < 12) return;
                        await ref.read(appControllerProvider).submitIdea(idea);
                        if (context.mounted) Navigator.pushNamed(context, '/live');
                      },
                icon: state.loading
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.arrow_forward),
                label: const Text('Summon sages'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class LiveSessionScreen extends ConsumerStatefulWidget {
  const LiveSessionScreen({super.key});

  @override
  ConsumerState<LiveSessionScreen> createState() => _LiveSessionScreenState();
}

class _LiveSessionScreenState extends ConsumerState<LiveSessionScreen> {
  @override
  void initState() {
    super.initState();
    scheduleMicrotask(() => ref.read(appControllerProvider).startConversation());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appControllerProvider);

    return AppShell(
      title: 'Live Session',
      actions: [
        TextButton.icon(
          onPressed: () async {
            await ref.read(appControllerProvider).loadReport();
            if (context.mounted) Navigator.pushNamed(context, '/report');
          },
          icon: const Icon(Icons.assessment),
          label: const Text('Report'),
        ),
      ],
      child: Column(
        children: [
          SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, index) => SageAvatar(persona: state.sages[index]),
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemCount: state.sages.length,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.separated(
              itemBuilder: (_, index) {
                final message = state.messages[index];
                final persona = state.sages.where((sage) => sage.key == message.sageKey).firstOrNull;
                return MessageBubble(message: message, persona: persona);
              },
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemCount: state.messages.length,
            ),
          ),
        ],
      ),
    );
  }
}

class ReportScreen extends ConsumerWidget {
  const ReportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appControllerProvider);
    final report = state.report ?? demoReport(state.idea);

    return AppShell(
      title: 'Report',
      child: ListView(
        children: [
          ScoreDial(score: report.score),
          const SizedBox(height: 20),
          MarkdownBody(
            data: report.markdown,
            styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
              p: const TextStyle(color: Color(0xffd7dde7), height: 1.45),
              h1: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
              h2: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child, this.title, this.actions});

  final Widget child;
  final String? title;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: title == null
          ? null
          : AppBar(
              title: Text(title!),
              backgroundColor: const Color(0xff111318),
              actions: actions,
            ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 820),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}

class SageAvatar extends StatelessWidget {
  const SageAvatar({super.key, required this.persona});

  final SagePersona persona;

  @override
  Widget build(BuildContext context) {
    final color = Color(int.parse(persona.avatarColor.substring(1), radix: 16) + 0xff000000);
    return Container(
      width: 210,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xff2a303a)),
        color: const Color(0xff191d24),
      ),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: color, child: Text(persona.archetype.substring(4, 5))),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(persona.archetype, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(persona.startupName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xff9aa4b2))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MessageBubble extends StatelessWidget {
  const MessageBubble({super.key, required this.message, this.persona});

  final ChatMessage message;
  final SagePersona? persona;

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == MessageRole.user;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 620),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isUser ? const Color(0xff164e63) : const Color(0xff191d24),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xff2a303a)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (persona != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: VerdictBadge(label: persona!.archetype),
              ),
            Text(message.text, style: const TextStyle(height: 1.35)),
          ],
        ),
      ),
    );
  }
}

class ScoreDial extends StatelessWidget {
  const ScoreDial({super.key, required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 170,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: const Color(0xff191d24),
        border: Border.all(color: const Color(0xff2a303a)),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 112,
            height: 112,
            child: CircularProgressIndicator(
              value: score / 100,
              strokeWidth: 10,
              backgroundColor: const Color(0xff2a303a),
            ),
          ),
          Text('$score', style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class VerdictBadge extends StatelessWidget {
  const VerdictBadge({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        color: const Color(0xff243040),
      ),
      child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xffcbd5e1))),
    );
  }
}

class _StatusStrip extends StatelessWidget {
  const _StatusStrip();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: const [
        VerdictBadge(label: 'FastAPI'),
        VerdictBadge(label: 'SQLite'),
        VerdictBadge(label: 'SSE'),
        VerdictBadge(label: 'Flutter'),
      ],
    );
  }
}

enum MessageRole { system, user, sage }

class ChatMessage {
  const ChatMessage({required this.role, required this.text, this.sageKey});

  final MessageRole role;
  final String text;
  final String? sageKey;

  ChatMessage copyWith({String? text}) {
    return ChatMessage(role: role, text: text ?? this.text, sageKey: sageKey);
  }
}

class SessionCreated {
  const SessionCreated({required this.sessionId, required this.sages});

  final String sessionId;
  final List<SagePersona> sages;

  factory SessionCreated.fromJson(Map<String, dynamic> json) {
    return SessionCreated(
      sessionId: json['session_id'] as String,
      sages: (json['sages'] as List<dynamic>)
          .map((item) => SagePersona.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SagePersona {
  const SagePersona({
    required this.key,
    required this.archetype,
    required this.startupName,
    required this.sector,
    required this.failureLens,
    required this.avatarColor,
  });

  final String key;
  final String archetype;
  final String startupName;
  final String sector;
  final String failureLens;
  final String avatarColor;

  factory SagePersona.fromJson(Map<String, dynamic> json) {
    return SagePersona(
      key: json['key'] as String,
      archetype: json['archetype'] as String,
      startupName: json['startup_name'] as String,
      sector: json['sector'] as String,
      failureLens: json['failure_lens'] as String,
      avatarColor: json['avatar_color'] as String,
    );
  }
}

class SageToken {
  const SageToken({required this.sageKey, required this.sageName, required this.token});

  final String sageKey;
  final String sageName;
  final String token;

  factory SageToken.fromJson(Map<String, dynamic> json) {
    return SageToken(
      sageKey: json['sage_key'] as String,
      sageName: json['sage_name'] as String,
      token: json['token'] as String,
    );
  }
}

class ReportData {
  const ReportData({required this.score, required this.markdown});

  final int score;
  final String markdown;

  factory ReportData.fromJson(Map<String, dynamic> json) {
    return ReportData(score: json['score'] as int, markdown: json['markdown'] as String);
  }
}

const demoSages = [
  SagePersona(
    key: 'distribution',
    archetype: 'The Distribution Skeptic',
    startupName: 'Quibi',
    sector: 'Streaming Media',
    failureLens: 'Paid demand did not match the commuter-video thesis.',
    avatarColor: '#7b68ee',
  ),
  SagePersona(
    key: 'timing',
    archetype: 'The Timing Realist',
    startupName: 'Juicero',
    sector: 'Consumer Hardware',
    failureLens: 'The hardware arrived before a clear daily need.',
    avatarColor: '#00a6a6',
  ),
  SagePersona(
    key: 'economics',
    archetype: 'The Unit Economics Hawk',
    startupName: 'MoviePass',
    sector: 'Subscription',
    failureLens: 'Loved by users, but punished by usage economics.',
    avatarColor: '#f59e0b',
  ),
];

ReportData demoReport(String idea) {
  return ReportData(
    score: 62,
    markdown: '''
# StartupSage Baseline Report

**Idea reviewed:** ${idea.isEmpty ? 'No idea submitted yet.' : idea}

## Verdict Summary
This phase 0 report is ready for the hackathon flow. It will be replaced by generated verdicts once the sage agents are live.

## Top Risks
- Distribution assumptions need evidence.
- Market timing needs a concrete trigger.
- Unit economics need a payback model.

## Suggested Improvements
- Pick one narrow beachhead.
- Interview 5 target users.
- Write the first CAC and retention assumptions before building.
''',
  );
}
