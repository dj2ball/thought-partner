# Troubleshooting Guide - Recipe System Issues

## 🐛 **Recent Issue: Mind Mapping Recipe Failures**

### **Problem Summary**
The `mind_mapping` recipe was failing with multiple cascading errors in both unified runner and legacy fallback paths.

### **Root Causes Identified**

#### **1. Pydantic Model vs Dictionary Access Inconsistency**
**Issue**: Mixed usage of `.get()` and attribute access on Pydantic models
```python
# ❌ WRONG - Using .get() on Pydantic model
if parallel_config.get("mode") == "branching":

# ✅ CORRECT - Using attribute access on Pydantic model  
if parallel_config.mode == "branching":
```

**Solution**: Be consistent with access patterns:
- **Pydantic models**: Use attribute access (`config.field`)
- **Dictionaries**: Use `.get()` method (`config.get("field")`)

#### **2. OpenAI JSON Schema Requirements**
**Issue**: Missing required schema properties for structured output
```
Error: 'required' is required to be supplied and to be an array including every key in properties. Missing 'connections'
```

**Root Cause**: OpenAI's structured output requires:
1. `additionalProperties: false` on all object schemas
2. All properties in `properties` must be in `required` array (no optional fields)

**Solution**: Updated schema generation to include all properties as required:
```python
def make_all_properties_required(schema):
    if schema.get('type') == 'object' and 'properties' in schema:
        prop_keys = list(schema['properties'].keys())
        schema['required'] = prop_keys  # All properties required
        schema['additionalProperties'] = False
```

#### **3. Legacy Runner JSON Format Requirements**
**Issue**: Legacy runner using `json_object` without "json" in prompt
```
Error: 'messages' must contain the word 'json' in some form, to use 'response_format' of type 'json_object'
```

**Solution**: When using OpenAI `json_object` response format, ensure prompt contains the word "json", or use structured output with schemas instead.

#### **4. Recipe Loading Cache Issues**
**Issue**: Schema fixes not taking effect until server restart
**Solution**: Server restart required after modifying `brainstorm_recipes.json` to reload recipes

### **Debugging Steps Performed**

1. **Identified Pydantic vs Dict inconsistency**
   - Fixed `parallel.py` to use proper attribute access
   - Made access patterns consistent throughout

2. **Fixed JSON Schema compliance**
   - Added `additionalProperties: false` to all object schemas
   - Made all properties required in OpenAI schemas

3. **Enhanced legacy fallback logic**
   - Added proper workflow type detection
   - Prevented iterative runner usage for non-iterative recipes

4. **Validated end-to-end functionality**
   - Tested unified runner directly: ✅ Working
   - Tested via API: ✅ Working after server restart

### **Files Modified**
- `/backend/app/services/runners/parallel.py` - Fixed Pydantic access patterns
- `/backend/app/routers/run.py` - Enhanced fallback logic
- `/backend/brainstorm_recipes.json` - Fixed JSON schemas
- `/backend/app/services/runner_factory.py` - Added get_runner_info method

## 🛠️ **General Troubleshooting Patterns**

### **JSON Schema Issues**
**Symptoms**: 
- "Invalid schema" errors from OpenAI
- "additionalProperties is required" messages  
- "required is required to be supplied" errors

**Solutions**:
1. Ensure all object schemas have `additionalProperties: false`
2. Include ALL properties in `required` arrays
3. Validate schemas before deployment

### **Pydantic Model Issues**
**Symptoms**:
- "object has no attribute 'get'" errors
- Inconsistent data access failures

**Solutions**:
1. Use `.field` for Pydantic models
2. Use `.get("field")` for dictionaries  
3. Check type before access: `isinstance(obj, dict)`

### **Runner Selection Issues**
**Symptoms**:
- "Recipe does not define iterative configuration" 
- Wrong runner type selected
- Fallback failures

**Solutions**:
1. Check `recipe.workflow.type` for new recipes
2. Check `recipe.iterative` for legacy recipes
3. Implement proper fallback logic

### **API vs Direct Testing Discrepancies**
**Symptoms**:
- Works in direct testing, fails via API
- Timeout issues with complex recipes

**Solutions**:
1. Test exact API parameter format
2. Check for parameter modifications in API layer
3. Ensure server restart after schema changes

## 🔍 **Debugging Commands**

### **Test Runner Factory**
```python
from app.services.runner_factory import RunnerFactory
from app.recipes import RECIPES

recipe = RECIPES['recipe_id']
factory = RunnerFactory()
info = factory.get_runner_info(recipe)
print(info)
```

### **Test Unified Runner Directly**
```python
import asyncio
from app.services import unified_runner
from app.recipes import RECIPES

async def test():
    recipe = RECIPES['recipe_id']
    params = {'param': 'value', 'user_id': 'test'}
    result = await unified_runner.run_recipe(recipe, params)
    print(result)

asyncio.run(test())
```

### **Validate JSON Schema**
```python
def validate_schema(schema):
    def check_objects(obj, path=''):
        if isinstance(obj, dict):
            if obj.get('type') == 'object':
                props = obj.get('properties', {})
                required = obj.get('required', [])
                has_additional = 'additionalProperties' in obj
                print(f'{path}: props={list(props.keys())}, required={required}, additionalProperties={has_additional}')
        # Recurse...
```

### **Test API Endpoint**
```bash
curl -X POST "http://localhost:8000/run" \
  -H "Content-Type: application/json" \
  -d '{"recipe_id": "recipe_name", "mode": "auto", "params": {"field": "value"}}'
```

## ✅ **Current Status**

- **Multi-agent debate**: ✅ Working (iterative runner)
- **Mind mapping**: ✅ Working (parallel runner)  
- **Backend architecture**: ✅ Complete (6 runner types)
- **Frontend rendering**: ✅ Complete (6 pattern renderers)
- **API endpoints**: ✅ Functional with graceful fallback

## 🎯 **Next Steps**

1. **Recipe Expansion**: Add remaining 15+ recipes across all runner types
2. **Error Monitoring**: Add better error logging for troubleshooting
3. **Schema Validation**: Add pre-deployment schema validation
4. **Testing**: Implement comprehensive test suite

## 📋 **Key Learnings**

1. **Consistency is Critical**: Mixing Pydantic and dict access patterns causes subtle bugs
2. **OpenAI Schema Requirements**: Structured output has strict schema requirements
3. **Server Restart Required**: Recipe changes need server restart to take effect
4. **Test Both Paths**: Always test both unified runner and API paths
5. **Schema Validation**: Validate JSON schemas before deployment to catch issues early

This troubleshooting guide should help future debugging and context resets.