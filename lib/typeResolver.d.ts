import { ParsedDocument } from './parsedDocument';
import { NameResolver } from './nameResolver';
import { SymbolStore } from './symbolStore';
import { TreeVisitor, MultiVisitor } from './types';
import { SymbolKind, PhpSymbol, SymbolModifier } from './symbol';
import { NameResolverVisitor } from './nameResolverVisitor';
import { Phrase, Token, SimpleVariable, ObjectCreationExpression, SubscriptExpression, FunctionCallExpression, MemberName, PropertyAccessExpression, ClassTypeDesignator, ScopedCallExpression, ScopedMemberName, ScopedPropertyAccessExpression, TernaryExpression } from 'php7parser';
export declare class ExpressionTypeResolver {
    document: ParsedDocument;
    nameResolver: NameResolver;
    symbolStore: SymbolStore;
    variableTable: VariableTable;
    constructor(document: ParsedDocument, nameResolver: NameResolver, symbolStore: SymbolStore, variableTable: VariableTable);
    resolveExpression(node: Phrase | Token): string;
    ternaryExpression(node: TernaryExpression): string;
    scopedMemberAccessExpression(node: ScopedPropertyAccessExpression | ScopedCallExpression, kind: SymbolKind): string;
    lookupMemberOnTypes(typeNames: string[], kind: SymbolKind, memberName: string, modifierMask: SymbolModifier, notModifierMask: SymbolModifier): PhpSymbol[];
    scopedMemberName(node: ScopedMemberName): string;
    classTypeDesignator(node: ClassTypeDesignator): string;
    objectCreationExpression(node: ObjectCreationExpression): string;
    simpleVariable(node: SimpleVariable): string;
    subscriptExpression(node: SubscriptExpression): string;
    functionCallExpression(node: FunctionCallExpression): string;
    memberName(node: MemberName): string;
    instanceMemberAccessExpression(node: PropertyAccessExpression, kind: SymbolKind): string;
    mergeTypes(symbols: PhpSymbol[]): string;
    protected _namePhraseToFqn(node: Phrase, kind: SymbolKind): string;
}
export declare class VariableTypeResolver extends MultiVisitor<Phrase | Token> {
    private _nameResolverVisitor;
    private _variableTypeVisitor;
    constructor(nameResolverVisitor: NameResolverVisitor, variableTypeVisitor: VariableTypeVisitor);
    haltAtOffset: number;
    readonly variableTable: VariableTable;
    static create(document: ParsedDocument, nameResolver: NameResolver, symbolStore: SymbolStore, variableTable: VariableTable): VariableTypeResolver;
}
export declare class VariableTypeVisitor implements TreeVisitor<Phrase | Token> {
    document: ParsedDocument;
    nameResolver: NameResolver;
    symbolStore: SymbolStore;
    variableTable: VariableTable;
    haltTraverse: boolean;
    haltAtOffset: number;
    constructor(document: ParsedDocument, nameResolver: NameResolver, symbolStore: SymbolStore, variableTable: VariableTable);
    preorder(node: Phrase | Token, spine: (Phrase | Token)[]): boolean;
    postorder(node: Phrase | Token, spine: (Phrase | Token)[]): void;
    private _qualifiedNameList(node);
    private _namePhraseToFqn(node, kind);
    private _catchClause(node);
    private _listIntrinsic(node);
    private _token(t);
    private _parameterSymbolFilter(s);
    private _methodOrFunction(node, kind);
    private _findSymbolForPhrase(p);
    private _anonymousFunctionUseVariableSymbolFilter(s);
    private _anonymousFunctionCreationExpression(node);
    private _simpleVariable(node);
    private _instanceOfExpression(node);
    private _isNonDynamicSimpleVariable(node);
    private _assignmentExpression(node);
    private _foreachStatement(node);
}
export declare class VariableTable {
    private _typeVariableSetStack;
    constructor();
    setType(varName: string, type: string): void;
    setTypeMany(varNames: string[], type: string): void;
    pushScope(carry?: string[]): void;
    popScope(): void;
    pushBranch(): void;
    popBranch(): void;
    /**
     * consolidates variables.
     * each variable can be any of types discovered in branches after this.
     */
    pruneBranches(): void;
    getType(varName: string, className?: string): string;
    private _mergeSets(a, b);
    private _top();
}
