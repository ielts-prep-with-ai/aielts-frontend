import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View, TextInput, Text } from "react-native";
import { Header } from "@/components/header";
import { QuestionCard } from "@/components/question-card";
import { LoadingView } from "@/components/ui/loading-view";
import { ErrorView } from "@/components/ui/error-view";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuestions } from "@/hooks/use-questions";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TopicQuestionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const topicId = parseInt((params.topic as string) || (params.id as string));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState<number | undefined>(
    undefined
  );

  const { questions, loading, error, refresh } = useQuestions({
    topic_id: topicId,
    part: selectedPart,
    page_index: 1,
    page_size: 10, // Backend validation: min=5, max=10
  });

  // Filter questions by search query
  const filteredQuestions = questions.filter((q) =>
    q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Practice Questions"
          subtitle="Select a question to practice"
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}
              >

        {/* Part Filter */}
        <View style={styles.filterContainer}>
          {[undefined, 1, 2, 3].map((part) => (
            <View
              key={part || "all"}
              style={[
                styles.filterButton,
                selectedPart === part && styles.filterButtonActive,
              ]}
              onTouchEnd={() => setSelectedPart(part)}
            >
              <IconSymbol
                name={
                  selectedPart === part ? "checkmark.circle.fill" : "circle"
                }
                size={20}
                color={selectedPart === part ? "#fff" : "#3BB9F0"}
              />

            
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedPart === part && styles.filterButtonTextActive,
                  ]}
                >
                  {part ? `Part ${part}` : "All Parts"}
                </Text>
             
            </View>
          ))}
        </View>
        </ScrollView>
        {loading && <LoadingView message="Loading questions..." />}

        {error && !loading && (
          <ErrorView message={error.message} onRetry={refresh} />
        )}

        {!loading && !error && filteredQuestions.length === 0 && (
          <EmptyState
            message={
              searchQuery
                ? "No questions match your search"
                : "No questions available"
            }
            icon="tray"
            actionTitle="Refresh"
            onAction={refresh}
          />
        )}

        {!loading && !error && filteredQuestions.length > 0 && (
          <View style={styles.questionsContainer}>
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                questionText={question.question_text}
                part={question.part}
                tagName={question.tag_name}
                onPress={() => router.push(`/speaking/practice/${question.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3BB9F0",
  },
  filterButtonActive: {
    backgroundColor: "#3BB9F0",
    borderColor: "#3BB9F0",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3BB9F0",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  questionsContainer: {
    gap: 16,
  },
});
