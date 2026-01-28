'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClient } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useI18n } from '@/lib/i18n';
import type {
    Environment,
    Conversation,
    EntityMetadata,
    AttributeMetadata,
    RelationshipMetadata,
    QueryDefinition,
    QueryField,
    QueryJoin,
    QueryFilter,
    QuerySort,
    QueryResult,
    SavedQuery,
    FilterOperator,
} from '@/types';
import {
    Database,
    Play,
    Download,
    Save,
    Trash2,
    Plus,
    ChevronDown,
    ChevronRight,
    Link2,
    Filter,
    ArrowUpDown,
    Loader2,
    FolderOpen,
    X,
} from 'lucide-react';

// Filter operators with labels
const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
    { value: 'eq', label: 'Igual a' },
    { value: 'ne', label: 'Diferente de' },
    { value: 'gt', label: 'Mayor que' },
    { value: 'ge', label: 'Mayor o igual' },
    { value: 'lt', label: 'Menor que' },
    { value: 'le', label: 'Menor o igual' },
    { value: 'contains', label: 'Contiene' },
    { value: 'startswith', label: 'Comienza con' },
    { value: 'endswith', label: 'Termina con' },
    { value: 'null', label: 'Es nulo' },
    { value: 'notnull', label: 'No es nulo' },
];

export default function QueryDesignerPage() {
    const router = useRouter();
    const isAuthenticated = useRequireAuth();
    const { t } = useI18n();

    // Base data
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
    const [loading, setLoading] = useState(true);

    // Selected environment
    const [selectedEnvId, setSelectedEnvId] = useState<string>('');

    // Entity metadata cache
    const [entities, setEntities] = useState<EntityMetadata[]>([]);
    const [attributesCache, setAttributesCache] = useState<Record<string, AttributeMetadata[]>>({});
    const [relationshipsCache, setRelationshipsCache] = useState<Record<string, RelationshipMetadata[]>>({});
    const [loadingEntities, setLoadingEntities] = useState(false);
    const [loadingAttributes, setLoadingAttributes] = useState<string | null>(null);

    // Query builder state
    const [primaryEntity, setPrimaryEntity] = useState<string>('');
    const [selectedFields, setSelectedFields] = useState<QueryField[]>([]);
    const [joins, setJoins] = useState<QueryJoin[]>([]);
    const [filters, setFilters] = useState<QueryFilter[]>([]);
    const [orderBy, setOrderBy] = useState<QuerySort[]>([]);

    // Results
    const [result, setResult] = useState<QueryResult | null>(null);
    const [executing, setExecuting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);

    // UI state
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [queryName, setQueryName] = useState('');
    const [queryDescription, setQueryDescription] = useState('');
    const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
    const [entitySearch, setEntitySearch] = useState('');
    const [attributeSearch, setAttributeSearch] = useState('');

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load entities when environment changes
    useEffect(() => {
        if (selectedEnvId) {
            loadEntities();
            loadSavedQueries();
        }
    }, [selectedEnvId]);

    const loadInitialData = async () => {
        try {
            const [envsData, convsData] = await Promise.all([
                ApiClient.get<Environment[]>('/environments'),
                ApiClient.get<Conversation[]>('/conversations'),
            ]);
            setEnvironments(envsData);
            setConversations(convsData);
            if (envsData.length > 0) {
                setSelectedEnvId(envsData[0].id);
            }
        } catch (error: any) {
            if (error.statusCode === 401) {
                ApiClient.removeToken();
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadEntities = async () => {
        if (!selectedEnvId) return;
        setLoadingEntities(true);
        try {
            const data = await ApiClient.get<EntityMetadata[]>(
                `/query-designer/environments/${selectedEnvId}/entities`
            );
            setEntities(data.sort((a, b) => a.displayName.localeCompare(b.displayName)));
        } catch (error) {
            console.error('Error loading entities:', error);
        } finally {
            setLoadingEntities(false);
        }
    };

    const loadSavedQueries = async () => {
        try {
            const data = await ApiClient.get<SavedQuery[]>('/query-designer/saved');
            setSavedQueries(data.filter(q => q.environmentId === selectedEnvId));
        } catch (error) {
            console.error('Error loading saved queries:', error);
        }
    };

    const loadAttributes = async (entityName: string) => {
        if (attributesCache[entityName]) return;
        setLoadingAttributes(entityName);
        try {
            const data = await ApiClient.get<AttributeMetadata[]>(
                `/query-designer/environments/${selectedEnvId}/entities/${entityName}/attributes`
            );
            setAttributesCache(prev => ({ ...prev, [entityName]: data }));
        } catch (error) {
            console.error('Error loading attributes:', error);
        } finally {
            setLoadingAttributes(null);
        }
    };

    const loadRelationships = async (entityName: string) => {
        if (relationshipsCache[entityName]) return;
        try {
            const data = await ApiClient.get<RelationshipMetadata[]>(
                `/query-designer/environments/${selectedEnvId}/entities/${entityName}/relationships`
            );
            setRelationshipsCache(prev => ({ ...prev, [entityName]: data }));
        } catch (error) {
            console.error('Error loading relationships:', error);
        }
    };

    // Entity selection
    const handleSelectPrimaryEntity = async (entityName: string) => {
        setPrimaryEntity(entityName);
        setSelectedFields([]);
        setJoins([]);
        setFilters([]);
        setOrderBy([]);
        setResult(null);
        // Auto-expand the selected entity
        setExpandedEntities(prev => {
            const next = new Set(prev);
            next.add(entityName);
            return next;
        });
        await loadAttributes(entityName);
        await loadRelationships(entityName);
    };

    const toggleEntityExpand = (entityName: string) => {
        setExpandedEntities(prev => {
            const next = new Set(prev);
            if (next.has(entityName)) {
                next.delete(entityName);
            } else {
                next.add(entityName);
                loadAttributes(entityName);
            }
            return next;
        });
    };

    // Field selection
    const toggleField = (entityAlias: string, fieldName: string, displayName: string) => {
        setSelectedFields(prev => {
            const exists = prev.find(f => f.entityAlias === entityAlias && f.fieldName === fieldName);
            if (exists) {
                return prev.filter(f => !(f.entityAlias === entityAlias && f.fieldName === fieldName));
            }
            return [...prev, { entityAlias, fieldName, displayName }];
        });
    };

    const isFieldSelected = (entityAlias: string, fieldName: string) => {
        return selectedFields.some(f => f.entityAlias === entityAlias && f.fieldName === fieldName);
    };

    // Join management
    const addJoin = async (relationship: RelationshipMetadata) => {
        const toEntityAlias = `${relationship.referencedEntity}_${joins.length + 1}`;
        const newJoin: QueryJoin = {
            fromEntityAlias: 'main',
            fromField: relationship.referencingAttribute,
            toEntity: relationship.referencedEntity,
            toEntityAlias,
            toField: relationship.referencedAttribute,
            joinType: 'left',
        };
        setJoins(prev => [...prev, newJoin]);
        await loadAttributes(relationship.referencedEntity);
    };

    const removeJoin = (index: number) => {
        const join = joins[index];
        setJoins(prev => prev.filter((_, i) => i !== index));
        // Remove fields from this join
        setSelectedFields(prev => prev.filter(f => f.entityAlias !== join.toEntityAlias));
    };

    // Filter management
    const addFilter = () => {
        if (!primaryEntity || selectedFields.length === 0) return;
        const firstField = selectedFields[0];
        setFilters(prev => [...prev, {
            entityAlias: firstField.entityAlias,
            fieldName: firstField.fieldName,
            operator: 'eq',
            value: '',
            logicalOperator: prev.length > 0 ? 'and' : undefined,
        }]);
    };

    const updateFilter = (index: number, updates: Partial<QueryFilter>) => {
        setFilters(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
    };

    const removeFilter = (index: number) => {
        setFilters(prev => prev.filter((_, i) => i !== index));
    };

    // Sort management
    const addSort = () => {
        if (selectedFields.length === 0) return;
        const firstField = selectedFields[0];
        setOrderBy(prev => [...prev, {
            entityAlias: firstField.entityAlias,
            fieldName: firstField.fieldName,
            direction: 'asc',
        }]);
    };

    const updateSort = (index: number, updates: Partial<QuerySort>) => {
        setOrderBy(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
    };

    const removeSort = (index: number) => {
        setOrderBy(prev => prev.filter((_, i) => i !== index));
    };

    // Build query definition
    const buildQueryDefinition = (): QueryDefinition => ({
        environmentId: selectedEnvId,
        primaryEntity,
        primaryEntityAlias: 'main',
        fields: selectedFields,
        joins: joins.length > 0 ? joins : undefined,
        filters: filters.length > 0 ? filters : undefined,
        orderBy: orderBy.length > 0 ? orderBy : undefined,
    });

    // Execute query
    const executeQuery = async (page: number = 1) => {
        if (!primaryEntity || selectedFields.length === 0) {
            alert('Selecciona una entidad y al menos un campo');
            return;
        }

        setExecuting(true);
        setCurrentPage(page);
        try {
            const queryDef = buildQueryDefinition();
            const data = await ApiClient.post<QueryResult>('/query-designer/execute', {
                query: queryDef,
                page,
                pageSize,
            });
            setResult(data);
        } catch (error: any) {
            alert(error.message || 'Error ejecutando la consulta');
        } finally {
            setExecuting(false);
        }
    };

    // Export to Excel
    const exportToExcel = async () => {
        if (!primaryEntity || selectedFields.length === 0) return;

        setExporting(true);
        try {
            const queryDef = buildQueryDefinition();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`${API_URL}/query-designer/export`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: queryDef }),
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `query-${primaryEntity}-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            alert(error.message || 'Error exportando');
        } finally {
            setExporting(false);
        }
    };

    // Save query
    const saveQuery = async () => {
        if (!queryName.trim()) {
            alert('Ingresa un nombre para la consulta');
            return;
        }

        try {
            await ApiClient.post('/query-designer/saved', {
                name: queryName,
                description: queryDescription,
                environmentId: selectedEnvId,
                definition: buildQueryDefinition(),
            });
            setShowSaveDialog(false);
            setQueryName('');
            setQueryDescription('');
            loadSavedQueries();
            alert('Consulta guardada');
        } catch (error: any) {
            alert(error.message || 'Error guardando');
        }
    };

    // Load saved query
    const loadQuery = (query: SavedQuery) => {
        const def = query.definition;
        setPrimaryEntity(def.primaryEntity);
        setSelectedFields(def.fields);
        setJoins(def.joins || []);
        setFilters(def.filters || []);
        setOrderBy(def.orderBy || []);
        setShowLoadDialog(false);
        setResult(null);
        
        // Load attributes for all entities involved
        loadAttributes(def.primaryEntity);
        def.joins?.forEach(j => loadAttributes(j.toEntity));
    };

    // Delete saved query
    const deleteSavedQuery = async (id: string) => {
        if (!confirm('¿Eliminar esta consulta guardada?')) return;
        try {
            await ApiClient.delete(`/query-designer/saved/${id}`);
            loadSavedQueries();
        } catch (error) {
            alert('Error eliminando');
        }
    };

    // Clear query
    const clearQuery = () => {
        setPrimaryEntity('');
        setSelectedFields([]);
        setJoins([]);
        setFilters([]);
        setOrderBy([]);
        setResult(null);
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar conversations={conversations} />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar conversations={conversations} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-border p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Query Designer</h1>
                        <p className="text-sm text-text-secondary">Diseña consultas personalizadas</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Environment selector */}
                        <select
                            value={selectedEnvId}
                            onChange={(e) => setSelectedEnvId(e.target.value)}
                            className="border border-border rounded-md px-3 py-2 text-sm"
                        >
                            {environments.map(env => (
                                <option key={env.id} value={env.id}>{env.name}</option>
                            ))}
                        </select>

                        <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Cargar
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSaveDialog(true)}
                            disabled={!primaryEntity || selectedFields.length === 0}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToExcel}
                            disabled={!result || exporting}
                        >
                            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Excel
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => executeQuery(1)}
                            disabled={!primaryEntity || selectedFields.length === 0 || executing}
                        >
                            {executing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            Ejecutar
                        </Button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left panel - Entity browser */}
                    <div className="w-80 border-r border-border bg-white overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-semibold text-text-primary mb-2">
                                Entidades ({entities.length})
                            </h2>
                            <input
                                type="text"
                                placeholder="Buscar entidad..."
                                value={entitySearch}
                                onChange={(e) => setEntitySearch(e.target.value)}
                                className="w-full border border-border rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        {loadingEntities ? (
                            <div className="p-4 text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-2">
                                {entities
                                    .filter(entity => 
                                        !entitySearch || 
                                        entity.displayName.toLowerCase().includes(entitySearch.toLowerCase()) ||
                                        entity.logicalName.toLowerCase().includes(entitySearch.toLowerCase())
                                    )
                                    .map(entity => (
                                    <div key={entity.logicalName} className="mb-1">
                                        <div
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 ${
                                                primaryEntity === entity.logicalName ? 'bg-primary-light text-primary' : ''
                                            }`}
                                            onClick={() => handleSelectPrimaryEntity(entity.logicalName)}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleEntityExpand(entity.logicalName);
                                                }}
                                                className="p-0.5"
                                            >
                                                {expandedEntities.has(entity.logicalName) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                            <Database className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-sm truncate">{entity.displayName}</span>
                                            {entity.isCustomEntity && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Custom</span>
                                            )}
                                        </div>

                                        {/* Expanded attributes */}
                                        {expandedEntities.has(entity.logicalName) && (
                                            <div className="ml-6 mt-1 space-y-0.5">
                                                {loadingAttributes === entity.logicalName ? (
                                                    <div className="text-xs text-gray-500 px-2 py-1">Cargando atributos...</div>
                                                ) : (
                                                    <>
                                                        {/* Attribute search when expanded */}
                                                        {primaryEntity === entity.logicalName && attributesCache[entity.logicalName]?.length > 20 && (
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar campo..."
                                                                value={attributeSearch}
                                                                onChange={(e) => setAttributeSearch(e.target.value)}
                                                                className="w-full border border-border rounded px-2 py-1 text-xs mb-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        )}
                                                        {attributesCache[entity.logicalName]
                                                            ?.filter(attr => 
                                                                !attributeSearch ||
                                                                attr.displayName.toLowerCase().includes(attributeSearch.toLowerCase()) ||
                                                                attr.logicalName.toLowerCase().includes(attributeSearch.toLowerCase())
                                                            )
                                                            .slice(0, 100)
                                                            .map(attr => (
                                                            <div
                                                                key={attr.logicalName}
                                                                className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-100 ${
                                                                    isFieldSelected('main', attr.logicalName) ? 'bg-green-100 text-green-700' : ''
                                                                }`}
                                                                onClick={() => toggleField('main', attr.logicalName, attr.displayName)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isFieldSelected('main', attr.logicalName)}
                                                                    onChange={() => {}}
                                                                    className="rounded"
                                                                />
                                                                <span className="truncate flex-1">{attr.displayName}</span>
                                                                <span className="text-gray-400 text-[10px]">{attr.attributeType}</span>
                                                            </div>
                                                        ))}
                                                        {attributesCache[entity.logicalName]?.length > 100 && !attributeSearch && (
                                                            <div className="text-xs text-gray-400 px-2 py-1">
                                                                +{attributesCache[entity.logicalName].length - 100} más (usa la búsqueda)
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Middle panel - Query builder */}
                    <div className="w-80 border-r border-border bg-white overflow-y-auto">
                        <div className="p-4 space-y-4">
                            {/* Selected fields */}
                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        Campos seleccionados ({selectedFields.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2">
                                    {selectedFields.length === 0 ? (
                                        <p className="text-xs text-gray-500">
                                            {primaryEntity 
                                                ? '👆 Marca los campos que deseas consultar' 
                                                : '👈 Primero selecciona una entidad'}
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            {selectedFields.map((field, idx) => (
                                                <div key={`${field.entityAlias}-${field.fieldName}`} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                                                    <span>{field.displayName || field.fieldName}</span>
                                                    <button
                                                        onClick={() => toggleField(field.entityAlias, field.fieldName, field.displayName || '')}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Joins/Relationships */}
                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Link2 className="w-4 h-4" />
                                        Relaciones ({joins.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2">
                                    {primaryEntity && relationshipsCache[primaryEntity] ? (
                                        <div className="space-y-1">
                                            {relationshipsCache[primaryEntity].slice(0, 20).map((rel, idx) => (
                                                <div key={rel.schemaName} className="flex items-center justify-between text-xs">
                                                    <span className="truncate">
                                                        {rel.relationshipType === 'ManyToOne' ? '→' : '←'} {rel.referencedEntity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs"
                                                        onClick={() => addJoin(rel)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Selecciona una entidad primero</p>
                                    )}

                                    {joins.length > 0 && (
                                        <div className="mt-3 pt-3 border-t space-y-1">
                                            <p className="text-xs font-medium text-gray-700">Joins activos:</p>
                                            {joins.map((join, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs bg-blue-50 px-2 py-1 rounded">
                                                    <span>{join.toEntity}</span>
                                                    <button onClick={() => removeJoin(idx)} className="text-red-500">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Filters */}
                            <Card>
                                <CardHeader className="py-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Filter className="w-4 h-4" />
                                            Filtros ({filters.length})
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" className="h-6" onClick={addFilter}>
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-2 space-y-2">
                                    {filters.map((filter, idx) => (
                                        <div key={idx} className="space-y-1 p-2 bg-gray-50 rounded">
                                            {idx > 0 && (
                                                <select
                                                    value={filter.logicalOperator || 'and'}
                                                    onChange={(e) => updateFilter(idx, { logicalOperator: e.target.value as 'and' | 'or' })}
                                                    className="text-xs border rounded px-1 py-0.5 mb-1"
                                                >
                                                    <option value="and">AND</option>
                                                    <option value="or">OR</option>
                                                </select>
                                            )}
                                            <div className="flex gap-1">
                                                <select
                                                    value={filter.fieldName}
                                                    onChange={(e) => updateFilter(idx, { fieldName: e.target.value })}
                                                    className="flex-1 text-xs border rounded px-1 py-1"
                                                >
                                                    {selectedFields.map(f => (
                                                        <option key={`${f.entityAlias}-${f.fieldName}`} value={f.fieldName}>
                                                            {f.displayName || f.fieldName}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button onClick={() => removeFilter(idx)} className="text-red-500 px-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="flex gap-1">
                                                <select
                                                    value={filter.operator}
                                                    onChange={(e) => updateFilter(idx, { operator: e.target.value as FilterOperator })}
                                                    className="flex-1 text-xs border rounded px-1 py-1"
                                                >
                                                    {FILTER_OPERATORS.map(op => (
                                                        <option key={op.value} value={op.value}>{op.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {filter.operator !== 'null' && filter.operator !== 'notnull' && (
                                                <input
                                                    type="text"
                                                    value={filter.value || ''}
                                                    onChange={(e) => updateFilter(idx, { value: e.target.value })}
                                                    placeholder="Valor..."
                                                    className="w-full text-xs border rounded px-2 py-1"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Order By */}
                            <Card>
                                <CardHeader className="py-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <ArrowUpDown className="w-4 h-4" />
                                            Ordenar ({orderBy.length})
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" className="h-6" onClick={addSort}>
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-2 space-y-2">
                                    {orderBy.map((sort, idx) => (
                                        <div key={idx} className="flex gap-1 items-center">
                                            <select
                                                value={sort.fieldName}
                                                onChange={(e) => updateSort(idx, { fieldName: e.target.value })}
                                                className="flex-1 text-xs border rounded px-1 py-1"
                                            >
                                                {selectedFields.map(f => (
                                                    <option key={`${f.entityAlias}-${f.fieldName}`} value={f.fieldName}>
                                                        {f.displayName || f.fieldName}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={sort.direction || 'asc'}
                                                onChange={(e) => updateSort(idx, { direction: e.target.value as 'asc' | 'desc' })}
                                                className="text-xs border rounded px-1 py-1"
                                            >
                                                <option value="asc">↑ ASC</option>
                                                <option value="desc">↓ DESC</option>
                                            </select>
                                            <button onClick={() => removeSort(idx)} className="text-red-500 px-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Clear button */}
                            {(primaryEntity || selectedFields.length > 0) && (
                                <Button variant="outline" size="sm" className="w-full" onClick={clearQuery}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Limpiar consulta
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right panel - Results */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h2 className="font-semibold text-text-primary">
                                Resultados
                                {result && (
                                    <span className="ml-2 text-sm font-normal text-text-secondary">
                                        ({result.totalCount?.toLocaleString() || result.rows.length} registros, {result.executionTime}ms)
                                    </span>
                                )}
                            </h2>
                            {result && result.totalCount && result.totalCount > pageSize && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1 || executing}
                                        onClick={() => executeQuery(currentPage - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="text-sm">
                                        Página {currentPage} de {Math.ceil(result.totalCount / pageSize)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!result.hasMore || executing}
                                        onClick={() => executeQuery(currentPage + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto">
                            {!result ? (
                                <div className="h-full flex items-center justify-center text-text-secondary">
                                    <div className="text-center">
                                        <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p>Selecciona una entidad, campos y ejecuta la consulta</p>
                                    </div>
                                </div>
                            ) : result.rows.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-text-secondary">
                                    <p>No se encontraron registros</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {result.columns.map(col => (
                                                <th
                                                    key={`${col.entityAlias}.${col.name}`}
                                                    className="text-left px-3 py-2 font-medium text-text-primary border-b"
                                                >
                                                    {col.displayName}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.rows.map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-gray-50 border-b">
                                                {result.columns.map(col => (
                                                    <td
                                                        key={`${col.entityAlias}.${col.name}`}
                                                        className="px-3 py-2 text-text-secondary"
                                                    >
                                                        {formatCellValue(row[`${col.entityAlias}.${col.name}`])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Query Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Guardar Consulta</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={queryName}
                                    onChange={(e) => setQueryName(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                    placeholder="Mi consulta..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                                <textarea
                                    value={queryDescription}
                                    onChange={(e) => setQueryDescription(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                    rows={3}
                                    placeholder="Descripción de la consulta..."
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="primary" onClick={saveQuery}>
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Query Dialog */}
            {showLoadDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                        <h3 className="text-lg font-semibold mb-4">Cargar Consulta Guardada</h3>
                        <div className="flex-1 overflow-y-auto">
                            {savedQueries.length === 0 ? (
                                <p className="text-text-secondary text-center py-8">No hay consultas guardadas</p>
                            ) : (
                                <div className="space-y-2">
                                    {savedQueries.map(query => (
                                        <div
                                            key={query.id}
                                            className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                                        >
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => loadQuery(query)}
                                            >
                                                <p className="font-medium">{query.name}</p>
                                                {query.description && (
                                                    <p className="text-sm text-text-secondary">{query.description}</p>
                                                )}
                                                <p className="text-xs text-text-muted">
                                                    {query.definition.primaryEntity} • {query.definition.fields.length} campos
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteSavedQuery(query.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-4 pt-4 border-t">
                            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to format cell values
function formatCellValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}
