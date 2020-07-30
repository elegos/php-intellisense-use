export interface MethodDefinition {
  name: string
  documentation: string
  isAbstract: boolean
  isConstructor: boolean
  isDestructor: boolean
  isFinal: boolean
  isPrivate: boolean
  isProtected: boolean
  isPublic: boolean
  isStatic: boolean
}

export interface ClassDefinition {
  fqcn: string
  documentation: string
  methods: MethodDefinition[]
}

export default interface FileParserWorkerResult {
  classes: ClassDefinition[]
}

export const NewFileParserWorkerResult = (): FileParserWorkerResult => ({
  classes: [],
});
