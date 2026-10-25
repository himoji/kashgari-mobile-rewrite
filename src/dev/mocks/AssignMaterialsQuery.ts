import grade from './MaterialsGradeQuery';
import grammar from './MaterialsGrammarQuery';

export default (vars: { grade?: number }) => ({ ...grade(vars), ...grammar() });
