import grade from './MaterialsGrade';
import grammar from './MaterialsGrammar';

export default (vars: { grade?: number }) => ({ ...grade(vars), ...grammar() });
