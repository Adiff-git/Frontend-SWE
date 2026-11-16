import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog, adjustedStock, categoryContains, validateProduct } from '../src/features/admin/catalogModel.js';
test('stock adjustment protects reservations and rejects malformed or unsafe quantities',()=>{
 const variant={stock:10,reserved:3};
 assert.equal(adjustedStock(variant,'add','4'),14);
 assert.equal(adjustedStock(variant,'remove','7'),3);
 for(const value of ['', '-1','1.5','Infinity','9007199254740992']) assert.throws(()=>adjustedStock(variant,'add',value));
 assert.throws(()=>adjustedStock(variant,'set','2'));
 assert.throws(()=>adjustedStock(variant,'remove','8'));
});
test('product validation preserves unique SKUs and reservation constraints across products',()=>{
 const catalog=createCatalog(); const product=structuredClone(catalog.products[0]);
 assert.deepEqual(validateProduct(product,catalog),{});
 product.variants[0].sku=catalog.products[1].variants[0].sku;
 assert.ok(validateProduct(product,catalog).variants);
 product.variants[0].sku='NEW-SKU'; product.variants[0].stock=0;
 assert.ok(validateProduct(product,catalog).variants);
 product.variants[0].stock=10; product.categoryId='missing';
 assert.ok(validateProduct(product,catalog).categoryId);
});
test('category traversal handles descendants and terminates on malformed cycles',()=>{
 const catalog=createCatalog(); assert.equal(categoryContains(catalog.categories,'phones','iphone'),true);
 assert.equal(categoryContains(catalog.categories,'iphone','phones'),false);
 assert.equal(categoryContains([{id:'a',parentId:'b'},{id:'b',parentId:'a'}],'missing','a'),false);
});

test('saved variants cannot be removed even when another variant remains',()=>{const catalog=createCatalog(); const product=structuredClone(catalog.products[0]); product.variants=[{id:'new',sku:'NEW',label:'New',price:1,stock:1,reserved:0}]; assert.ok(validateProduct(product,catalog).variants);});
test('variant 2 and specification field errors target the specific row id',()=>{const catalog=createCatalog(); const product=structuredClone(catalog.products[0]); product.variants.push({id:'v2',sku:product.variants[0].sku,label:'512GB',price:35000000,stock:5,reserved:0}); product.specifications=[{id:'s1',name:'RAM',value:''}]; const errs=validateProduct(product,catalog); assert.ok(errs.variantFields?.v2?.sku); assert.equal(errs.variantFields?.[product.variants[0].id],undefined); assert.ok(errs.specFields?.s1?.value);});
