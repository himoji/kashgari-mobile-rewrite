export default (v: { studentId: string }) => ({ addChild: v.studentId.trim().length >= 3 });
