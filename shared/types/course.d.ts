export interface Course {
    id: string;
    institutionId: string;
    name: string;
    description: string;
    createdBy: string;
    createdAt: Date;
}
export interface Subject {
    id: string;
    courseId: string;
    name: string;
    description: string;
}
export interface Topic {
    id: string;
    subjectId: string;
    name: string;
    description: string;
    difficultyLevel: DifficultyLevel;
    orderIndex: number;
}
export interface CurriculumContent {
    id: string;
    topicId: string;
    uploadedBy: string;
    title: string;
    contentText: string;
    fileUrl?: string;
    embeddingId?: string;
    createdAt: Date;
}
export interface PrerequisiteRelation {
    id: string;
    topicId: string;
    prerequisiteTopicId: string;
}
export declare enum DifficultyLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced"
}
//# sourceMappingURL=course.d.ts.map