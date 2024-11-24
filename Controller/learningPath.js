const learningPath = {
    topics: [
      {
        topic: "Linked List",
        subtopics: [
          {
            subtopic: "Insertion",
            levels: [
              { id: 1, name: "Insertion At Front", isLocked: false, isCompleted: false, danger: false },
              { id: 2, name: "Insertion At End", isLocked: true, isCompleted: false, danger: false },
              { id: 3, name: "Insertion In Middle", isLocked: true, isCompleted: false, danger: false }
            ],
            assessment: {
              id: 1,
              name: "Insertion Assessment",
              duration: "15 minutes",
              isLocked: true,
              isCompleted: false,
              danger: false
            }
          },
          {
            subtopic: "Traversal",
            levels: [
              { id: 4, name: "Traversal Count Nodes", isLocked: true, isCompleted: false, danger: false },
              { id: 5, name: "Traversal Sum", isLocked: true, isCompleted: false, danger: false },
              { id: 6, name: "Traversal Maximum", isLocked: true, isCompleted: false, danger: false }
            ],
            assessment: {
              id: 2,
              name: "Traversal Assessment",
              duration: "15 minutes",
              isLocked: true,
              isCompleted: false,
              danger: false
            }
          },
          {
            subtopic: "Deletion",
            levels: [
              { id: 7, name: "Deletion At Front", isLocked: true, isCompleted: false, danger: false },
              { id: 8, name: "Deletion At End", isLocked: true, isCompleted: false, danger: false },
              { id: 9, name: "Deletion In Middle", isLocked: true, isCompleted: false, danger: false }
            ],
            assessment: {
              id: 3,
              name: "Deletion Assessment",
              duration: "15 minutes",
              isLocked: true,
              isCompleted: false,
              danger: false
            }
          }
        ]
      }
    ]
  };
  
  module.exports = learningPath;
  