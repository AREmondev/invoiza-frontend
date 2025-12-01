"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { useProductStore } from "@/store/useProductStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Package, Ruler, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductUnit, ProductVariation } from "@/types";
import { GodownSelector } from "@/components/shared/GodownSelector";
import { useToast } from "@/hooks/use-toast";

interface UnitPricingForm {
  secondaryUnitId: string;
  conversionId?: string; // If using existing conversion
  conversionFactor?: number; // If creating new conversion
  salePrice: number;
  purchasePrice: number;
  openingQuantity?: number; // Opening quantity for secondary unit
}

interface ColorVariationForm {
  id: string;
  name: string; // Color name (e.g., "Red", "Blue")
  sku: string;
  color: string; // Color hex code
}

export function AddProductModal() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBaseUnitId, setSelectedBaseUnitId] = useState<string>("");
  const [unitPricings, setUnitPricings] = useState<UnitPricingForm[]>([]);
  const [colorVariations, setColorVariations] = useState<ColorVariationForm[]>([]);
  const [selectedGodownIds, setSelectedGodownIds] = useState<string[]>([]);
  const [baseSalePrice, setBaseSalePrice] = useState<number>(0);
  const [basePurchasePrice, setBasePurchasePrice] = useState<number>(0);
  const [baseStockQuantity, setBaseStockQuantity] = useState<number>(0);
  const [minStockLevel, setMinStockLevel] = useState<number>(0);
  const [isCreatingConversion, setIsCreatingConversion] = useState<boolean>(false);
  const isUpdatingRef = useRef(false);
  
  // Fetch data from backend
  const brands = useQuery(
    api.queries.brands.getBrands,
    userEmail ? { userEmail } : "skip"
  );
  const categories = useQuery(
    api.queries.categories.getCategories,
    userEmail ? { userEmail } : "skip"
  );
  const units = useQuery(
    api.queries.units.getUnits,
    userEmail ? { userEmail } : "skip"
  );
  const conversions = useQuery(
    api.queries.units.getUnitConversions,
    userEmail ? { userEmail } : "skip"
  );
  
  const createProductMutation = useMutation(api.mutations.products.createProduct);
  const createUnitConversion = useMutation(api.mutations.units.createUnitConversion);

  // Get base unit (smallest unit)
  const baseUnit = units?.find((u: any) => u.isBaseUnit) || units?.[0];
  
  useEffect(() => {
    if (baseUnit && !selectedBaseUnitId) {
      setSelectedBaseUnitId(baseUnit._id);
    }
  }, [baseUnit, selectedBaseUnitId]);

  // Helper function to get current conversion factor
  const getConversionFactor = (): number => {
    const currentPricing = unitPricings[0];
    if (!currentPricing?.secondaryUnitId) return 1;
    
    if (currentPricing.conversionId) {
      const selectedConv = conversions?.find(
        (c: any) => c._id === currentPricing.conversionId && 
        c.baseUnitId === selectedBaseUnitId && 
        c.secondaryUnitId === currentPricing.secondaryUnitId
      );
      return selectedConv?.conversionFactor || 1;
    }
    
    return currentPricing.conversionFactor || 1;
  };

  // Helper function to calculate secondary prices from base prices
  const calculateSecondaryPrices = (factor: number) => {
    if (factor <= 0 || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    const newSalePrice = baseSalePrice > 0 ? Math.round((baseSalePrice / factor) * 100) / 100 : 0;
    const newPurchasePrice = basePurchasePrice > 0 ? Math.round((basePurchasePrice / factor) * 100) / 100 : 0;
    const newOpeningQuantity = baseStockQuantity > 0 ? Math.round(baseStockQuantity * factor * 100) / 100 : 0;
    
    setUnitPricings(prev => {
      if (prev.length === 0 || !prev[0]?.secondaryUnitId) {
        isUpdatingRef.current = false;
        return prev;
      }
      
      const updated = prev.map((pricing, i) => 
        i === 0 ? {
          ...pricing,
          salePrice: newSalePrice,
          purchasePrice: newPurchasePrice,
          openingQuantity: newOpeningQuantity,
        } : pricing
      );
      
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
      
      return updated;
    });
  };

  const addUnitPricing = () => {
    const newPricing: UnitPricingForm = {
      secondaryUnitId: "",
      salePrice: 0,
      purchasePrice: 0,
    };
    setUnitPricings([...unitPricings, newPricing]);
  };

  const removeUnitPricing = (index: number) => {
    setUnitPricings(unitPricings.filter((_, i) => i !== index));
  };

  const updateUnitPricing = (index: number, field: keyof UnitPricingForm, value: any) => {
    setUnitPricings(prev => prev.map((pricing, i) => 
      i === index ? { ...pricing, [field]: value } : pricing
    ));
  };

  const addColorVariation = () => {
    const newVariation: ColorVariationForm = {
      id: Date.now().toString(),
      name: '',
      sku: '',
      color: '#000000',
    };
    setColorVariations([...colorVariations, newVariation]);
  };

  const removeColorVariation = (variationId: string) => {
    setColorVariations(colorVariations.filter(variation => variation.id !== variationId));
  };

  const updateColorVariation = (variationId: string, field: keyof ColorVariationForm, value: any) => {
    setColorVariations(colorVariations.map(variation => 
      variation.id === variationId ? { ...variation, [field]: value } : variation
    ));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productName = formData.get('name') as string;
    if (!productName || productName.trim() === '') {
      toast({
        title: "Error",
        description: "Item Name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedBaseUnitId) {
      toast({
        title: "Error",
        description: "Please select a base unit",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create new conversions if needed and get conversion IDs
      const conversionIds: string[] = [];
      
      for (const pricing of unitPricings) {
        if (pricing.secondaryUnitId) {
          if (pricing.conversionId) {
            // Use existing conversion
            conversionIds.push(pricing.conversionId);
          } else if (pricing.conversionFactor) {
            // Create new conversion
            try {
              const newConversionId = await createUnitConversion({
                baseUnitId: selectedBaseUnitId as any,
                secondaryUnitId: pricing.secondaryUnitId as any,
                conversionFactor: pricing.conversionFactor,
                description: `1 ${baseUnit?.abbreviation} = ${pricing.conversionFactor} ${units?.find((u: any) => u._id === pricing.secondaryUnitId)?.abbreviation}`,
                userEmail: userEmail || undefined,
              });
              conversionIds.push(newConversionId as any);
            } catch (error: any) {
              console.error("Error creating conversion:", error);
              // Continue even if conversion creation fails
            }
          }
        }
      }
      
      // Build unit pricing array - only include complete unit pricings
      const unitPricing = unitPricings
        .filter(p => {
          // Must have secondary unit
          if (!p.secondaryUnitId) return false;
          // Must have either conversionId or conversionFactor
          if (!p.conversionId && !p.conversionFactor) return false;
          return true;
        })
        .map(pricing => {
          // Use calculated prices if not set
          const selectedSecondaryUnit = units?.find((u: any) => u._id === pricing.secondaryUnitId);
          const availableConversions = conversions?.filter(
            (c: any) => c.baseUnitId === selectedBaseUnitId && c.secondaryUnitId === pricing.secondaryUnitId
          ) || [];
          const selectedConversion = pricing.conversionId 
            ? availableConversions.find((c: any) => c._id === pricing.conversionId)
            : null;
          const conversionFactor = selectedConversion?.conversionFactor || pricing.conversionFactor || 1;
          
          // Secondary Price = Base Price / Conversion Rate
          const finalSalePrice = pricing.salePrice > 0 ? pricing.salePrice : (conversionFactor > 0 ? baseSalePrice / conversionFactor : 0);
          const finalPurchasePrice = pricing.purchasePrice > 0 ? pricing.purchasePrice : (conversionFactor > 0 ? basePurchasePrice / conversionFactor : 0);
          
          return {
            unitId: pricing.secondaryUnitId as any,
            salePrice: Math.round(finalSalePrice * 100), // Convert to cents
            purchasePrice: Math.round(finalPurchasePrice * 100),
          };
        });
      
      // Build color variations - schema uses attributes, but mutation expects direct color field
      // Check both formats to match backend
      const variations = colorVariations
        .filter(v => v.name && v.sku) // Only include complete variations
        .map(variation => ({
          name: variation.name,
          sku: variation.sku,
          color: variation.color, // Direct color field for mutation
          barcode: undefined as string | undefined,
          isActive: true,
        }));
      
      // Build godown stocks
      const godownStocks = selectedGodownIds.length > 0
        ? selectedGodownIds.map(godownId => ({
            godownId: godownId as any,
            quantity: baseStockQuantity / selectedGodownIds.length, // Distribute evenly
          }))
        : undefined;
      
      const productSku = (formData.get('sku') as string)?.trim();
      if (!productSku) {
        toast({
          title: "Error",
          description: "SKU is required",
          variant: "destructive",
        });
        return;
      }
      
      await createProductMutation({
        name: productName.trim(),
        sku: productSku,
        description: (formData.get('description') as string) || undefined,
        barcode: (formData.get('barcode') as string) || undefined,
        brandId: selectedBrandId ? (selectedBrandId as any) : undefined,
        categoryId: selectedCategoryId ? (selectedCategoryId as any) : undefined,
        baseUnitId: selectedBaseUnitId as any,
        salePrice: Math.round(baseSalePrice * 100), // Convert to cents
        purchasePrice: Math.round(basePurchasePrice * 100),
        stockQuantity: baseStockQuantity,
        minStockLevel: minStockLevel,
        maxStockLevel: 10000,
        unitPricing: unitPricing.length > 0 ? unitPricing : undefined,
        unitConversionIds: conversionIds.length > 0 ? (conversionIds as any[]) : undefined,
        godownStocks: godownStocks,
        variations: variations.length > 0 ? variations : undefined,
        images: [],
        metadata: expiryDate ? { expiryDate: expiryDate.toISOString() } : undefined,
        userEmail: userEmail || undefined,
      });
      
      setOpen(false);
      // Reset form
      setSelectedBrandId("");
      setSelectedCategoryId("");
      setSelectedBaseUnitId(baseUnit?._id || "");
      setUnitPricings([]);
      setColorVariations([]);
      setExpiryDate(undefined);
      setBaseStockQuantity(0);
      setBaseSalePrice(0);
      setBasePurchasePrice(0);
      setMinStockLevel(0);
      setSelectedGodownIds([]);
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create product',
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Product</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="units">Units & Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" name="sku" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brandId">Brand (Optional)</Label>
                  <select
                    id="brandId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                  >
                    <option value="">Select a brand</option>
                    {brands?.map((brand: any) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category (Optional)</Label>
                  <select
                    id="categoryId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {categories?.map((category: any) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <GodownSelector
                  selectedGodownIds={selectedGodownIds}
                  onGodownsChange={setSelectedGodownIds}
                  allowMultiple={true}
                  allowCreate={true}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Color Variations */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Color Variations (Optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Add color variations for product identification
                    </p>
                  </div>
                  <Button type="button" onClick={addColorVariation} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Color
                  </Button>
                </div>
                
                {colorVariations.map((variation, index) => (
                  <div key={variation.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Color {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColorVariation(variation.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Color Name *</Label>
                        <Input
                          value={variation.name}
                          onChange={(e) => updateColorVariation(variation.id, 'name', e.target.value)}
                          placeholder="e.g., Red, Blue, Green"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SKU *</Label>
                        <Input
                          value={variation.sku}
                          onChange={(e) => updateColorVariation(variation.id, 'sku', e.target.value)}
                          placeholder="Unique SKU for this color"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color Code *</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={variation.color}
                            onChange={(e) => updateColorVariation(variation.id, 'color', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={variation.color}
                            onChange={(e) => updateColorVariation(variation.id, 'color', e.target.value)}
                            placeholder="#000000"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {colorVariations.length === 0 && (
                  <div className="text-center py-4 text-gray-500 border rounded-lg text-sm">
                    No color variations added yet. Click "Add Color" to add one.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="units" className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Unit & Pricing Configuration</h3>
                
                {/* Section 1: Unit & Conversion */}
                <div className="space-y-4 border rounded-lg p-6 bg-white">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Unit & Conversion</h4>
                  
                  {/* Unit Selection */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Base Unit</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedBaseUnitId}
                        onChange={(e) => {
                          setSelectedBaseUnitId(e.target.value);
                          setUnitPricings([]); // Reset unit pricings when base unit changes
                        }}
                        required
                      >
                        <option value="">Select base unit</option>
                        {units?.map((unit: any) => (
                          <option key={unit._id} value={unit._id}>
                            {unit.name.toUpperCase()} ({unit.abbreviation})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Secondary Unit</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={unitPricings[0]?.secondaryUnitId || ""}
                        onChange={(e) => {
                          const secondaryUnitId = e.target.value;
                          if (secondaryUnitId) {
                            // Create or update unit pricing entry
                            if (unitPricings.length === 0) {
                              // Create new entry directly
                              setUnitPricings([{
                                secondaryUnitId: secondaryUnitId,
                                conversionId: undefined,
                                conversionFactor: undefined,
                                salePrice: 0,
                                purchasePrice: 0,
                                openingQuantity: 0,
                              }]);
                            } else {
                              // Update existing entry
                              updateUnitPricing(0, 'secondaryUnitId', secondaryUnitId);
                              updateUnitPricing(0, 'conversionId', undefined);
                              updateUnitPricing(0, 'conversionFactor', undefined);
                              updateUnitPricing(0, 'salePrice', 0);
                              updateUnitPricing(0, 'purchasePrice', 0);
                              updateUnitPricing(0, 'openingQuantity', 0);
                            }
                          } else {
                            // Remove unit pricing if secondary unit is cleared
                            setUnitPricings([]);
                          }
                        }}
                        required
                        disabled={!selectedBaseUnitId}
                      >
                        <option value="">Select secondary unit</option>
                        {units && units.length > 0 ? (
                          units.filter((u: any) => u._id !== selectedBaseUnitId).map((unit: any) => (
                            <option key={unit._id} value={unit._id}>
                              {unit.name.toUpperCase()} ({unit.abbreviation})
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No units available</option>
                        )}
                      </select>
                    </div>
                  </div>
                  
                  {/* Conversion Rates */}
                  {selectedBaseUnitId && unitPricings[0]?.secondaryUnitId && (
                    <div className="space-y-3 mt-6">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Conversion Rates</Label>
                      <RadioGroup
                        value={
                          (() => {
                            const currentPricing = unitPricings[0];
                            if (currentPricing?.conversionId) {
                              return `conv-${currentPricing.conversionId}`;
                            } else if (currentPricing?.conversionFactor) {
                              return "custom";
                            }
                            return "";
                          })()
                        }
                        onValueChange={(value) => {
                          if (isUpdatingRef.current) return;
                          
                          if (value === "custom") {
                            // Clear conversionId and keep conversionFactor
                            setUnitPricings(prev => {
                              const current = prev[0];
                              if (!current) return prev;
                              
                              const conversionFactor = current.conversionFactor || 1;
                              const updated = prev.map((price, idx) =>
                                idx === 0
                                  ? {
                                      ...price,
                                      conversionId: undefined, // Clear existing conversion ID
                                    }
                                  : price
                              );
                              
                              // Calculate prices after state update
                              setTimeout(() => {
                                calculateSecondaryPrices(conversionFactor);
                              }, 0);
                              
                              return updated;
                            });
                          } else if (value.startsWith("conv-")) {
                            const convId = value.replace("conv-", "");
                            // Find the conversion to get its factor
                            const selectedConv = conversions?.find(
                              (c: any) => c._id === convId && c.baseUnitId === selectedBaseUnitId && c.secondaryUnitId === unitPricings[0]?.secondaryUnitId
                            );
                            
                            if (!selectedConv) return;
                            
                            setUnitPricings(prev => {
                              const current = prev[0];
                              if (!current) return prev;
                              
                              const conversionFactor = selectedConv.conversionFactor || 1;
                              const updated = prev.map((price, idx) =>
                                idx === 0
                                  ? {
                                      ...price,
                                      conversionId: convId, // Store just the ID, not "conv-{id}"
                                      conversionFactor: undefined, // Clear custom factor when using existing conversion
                                    }
                                  : price
                              );
                              
                              // Calculate prices after state update
                              setTimeout(() => {
                                calculateSecondaryPrices(conversionFactor);
                              }, 0);
                              
                              return updated;
                            });
                          }
                        }}
                        className="space-y-2 max-h-64 overflow-y-auto"
                      >
                                {/* Custom Conversion Option */}
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                          <RadioGroupItem value="custom" id="custom-conversion" />
                          <label htmlFor="custom-conversion" className="flex-1 flex items-center gap-2 cursor-pointer" onClick={(e) => {
                            // Select custom radio when clicking on the label
                            const radio = document.getElementById("custom-conversion") as HTMLInputElement;
                            if (radio) {
                              radio.click();
                            }
                          }}>
                            <span className="text-sm">1 {baseUnit?.abbreviation.toUpperCase()} =</span>
                            <Input
                              type="string"
                             
                              value={unitPricings[0]?.conversionFactor?.toString() || ""}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (isUpdatingRef.current) return;
                                
                                const inputValue = e.target.value;
                                const factor = inputValue ? parseFloat(inputValue) : undefined;
                                
                                if (!factor || factor <= 0) return;
                                
                                // Update state with the conversion factor
                                setUnitPricings(prev => {
                                  const updated = prev.map((pricing, idx) => 
                                    idx === 0 ? {
                                      ...pricing,
                                      conversionId: undefined, // Clear conversionId when using custom
                                      conversionFactor: factor
                                    } : pricing
                                  );
                                  
                                  // Calculate prices immediately when conversion factor changes
                                  setTimeout(() => {
                                    calculateSecondaryPrices(factor);
                                  }, 0);
                                  
                                  return updated;
                                });
                                
                                // Ensure custom radio is selected
                                const customRadio = document.getElementById("custom-conversion") as HTMLInputElement;
                                if (customRadio && !customRadio.checked) {
                                  customRadio.click();
                                }
                                // Ensure custom radio is selected by triggering RadioGroup
                                // if (factor) {
                                //   // Manually set the RadioGroup value
                                //   const radioGroup = document.querySelector('[role="radiogroup"]') as HTMLElement;
                                //   if (radioGroup) {
                                //     const customRadio = document.getElementById("custom-conversion") as HTMLInputElement;
                                //     if (customRadio) {
                                //       customRadio.checked = true;
                                //       // Trigger change event for RadioGroup
                                //       const changeEvent = new Event('change', { bubbles: true });
                                //       customRadio.dispatchEvent(changeEvent);
                                //     }
                                //   }
                                // }
                                
                                // updateUnitPricing(0, 'conversionFactor', parseFloat(e.target.value) || 0);
                                // updateUnitPricing(0, 'conversionId', undefined);
                                
                                // // Auto-calculate secondary prices
                                // if (factor && baseSalePrice > 0 && basePurchasePrice > 0) {
                                //   updateUnitPricing(0, 'salePrice', Math.round((baseSalePrice / factor) * 100) / 100);
                                //   updateUnitPricing(0, 'purchasePrice', Math.round((basePurchasePrice / factor) * 100) / 100);
                                //   if (baseStockQuantity > 0) {
                                //     updateUnitPricing(0, 'openingQuantity', Math.round(baseStockQuantity * factor * 100) / 100);
                                //   }
                                // }
                                
                                // // Create conversion rate if it doesn't exist (debounced)
                                // if (factor && factor > 0 && selectedBaseUnitId && unitPricings[0]?.secondaryUnitId && !isCreatingConversion) {
                                //   // Check if conversion already exists
                                //   const existingConv = conversions?.find(
                                //     (c: any) => 
                                //       c.baseUnitId === selectedBaseUnitId && 
                                //       c.secondaryUnitId === unitPricings[0]?.secondaryUnitId &&
                                //       Math.abs(c.conversionFactor - factor) < 0.01 // Allow small floating point differences
                                //   );
                                  
                                //   // Only create if it doesn't exist
                                //   if (!existingConv) {
                                //     // Use a timeout to debounce the creation
                                //     setTimeout(async () => {
                                //       // Double-check it still doesn't exist and value hasn't changed
                                //       const currentFactor = unitPricings[0]?.conversionFactor;
                                //       if (currentFactor === factor && !isCreatingConversion) {
                                //         const stillNotExists = !conversions?.find(
                                //           (c: any) => 
                                //             c.baseUnitId === selectedBaseUnitId && 
                                //             c.secondaryUnitId === unitPricings[0]?.secondaryUnitId &&
                                //             Math.abs(c.conversionFactor - factor) < 0.01
                                //         );
                                        
                                //         if (stillNotExists) {
                                //           setIsCreatingConversion(true);
                                //           try {
                                //             const newConversionId = await createUnitConversion({
                                //               baseUnitId: selectedBaseUnitId as any,
                                //               secondaryUnitId: unitPricings[0]?.secondaryUnitId as any,
                                //               conversionFactor: factor,
                                //               description: `1 ${baseUnit?.abbreviation} = ${factor} ${units?.find((u: any) => u._id === unitPricings[0]?.secondaryUnitId)?.abbreviation}`,
                                //               userEmail: userEmail || undefined,
                                //             });
                                            
                                //             // Update to use the newly created conversion
                                //             updateUnitPricing(0, 'conversionId', newConversionId as string);
                                //             updateUnitPricing(0, 'conversionFactor', undefined);
                                            
                                //             toast({
                                //               title: "Success",
                                //               description: "New conversion rate created successfully",
                                //             });
                                //           } catch (error: any) {
                                //             console.error("Error creating conversion:", error);
                                //             toast({
                                //               title: "Error",
                                //               description: error.message || "Failed to create conversion rate",
                                //               variant: "destructive",
                                //             });
                                //           } finally {
                                //             setIsCreatingConversion(false);
                                //           }
                                //         }
                                //       }
                                //     }, 2000); // Wait 2 seconds after user stops typing
                                //   }
                                // }
                              }}
                              onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                                e.stopPropagation();
                                // Select custom radio when input is clicked
                                const radio = document.getElementById("custom-conversion") as HTMLInputElement;
                                if (radio) {
                                  radio.click();
                                }
                              }}
                              onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                                e.stopPropagation();
                                // Select custom radio when input is focused
                                const radio = document.getElementById("custom-conversion") as HTMLInputElement;
                                if (radio) {
                                  radio.click();
                                }
                              }}
                              placeholder="0"
                              className="w-20 h-8 border-gray-300 rounded-md focus:ring-blue-500"
                            />
                            <span className="text-sm">{units?.find((u: any) => u._id === unitPricings[0]?.secondaryUnitId)?.abbreviation.toUpperCase()}</span>
                            {isCreatingConversion && (
                              <span className="text-xs text-blue-500">Creating...</span>
                            )}
                          </label>
                        </div>
                        {/* Existing Conversions */}
                        {conversions && conversions.length > 0 ? (
                          conversions.filter(
                            (c: any) => c.baseUnitId === selectedBaseUnitId && c.secondaryUnitId === unitPricings[0]?.secondaryUnitId
                          ).length > 0 ? (
                            conversions.filter(
                              (c: any) => c.baseUnitId === selectedBaseUnitId && c.secondaryUnitId === unitPricings[0]?.secondaryUnitId
                            ).map((conv: any) => (
                              <div 
                                key={conv._id} 
                                className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  // Manually trigger radio selection
                                  const radio = document.getElementById(`conv-${conv._id}`) as HTMLInputElement;
                                  if (radio) {
                                    radio.click();
                                  }
                                }}
                              >
                                <RadioGroupItem value={`conv-${conv._id}`} id={`conv-${conv._id}`} />
                                <label htmlFor={`conv-${conv._id}`} className="flex-1 cursor-pointer text-sm">
                                  1 {baseUnit?.abbreviation.toUpperCase()} = {conv.conversionFactor} {units?.find((u: any) => u._id === unitPricings[0]?.secondaryUnitId)?.abbreviation.toUpperCase()}
                                </label>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400 p-2">No existing conversions. Enter a custom value to create one.</div>
                          )
                        ) : (
                          <div className="text-xs text-gray-400 p-2">No existing conversions. Enter a custom value to create one.</div>
                        )}
                        
                
                      </RadioGroup>
                    </div>
                  )}
                </div>
                
                 {/* Section 2: Pricing & Stock */}
                 {selectedBaseUnitId && unitPricings[0]?.secondaryUnitId && (unitPricings[0]?.conversionId || unitPricings[0]?.conversionFactor) && (
                   <div className="space-y-4 border rounded-lg p-6 bg-white">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Unit-wise Pricing & Quantity</h4>
                    
                    <div className="grid grid-cols-2 gap-6 relative">
                      {/* Base Unit Column */}
                      <div className="space-y-4 p-4 border-2 border-gray-200 rounded-md bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Base Unit ({baseUnit?.abbreviation.toUpperCase()})
                          </Label>
                        </div>
                        
                        {/* Purchase Price */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Purchase Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={basePurchasePrice}
                              onChange={(e) => {
                                if (isUpdatingRef.current) return;
                                
                                const value = parseFloat(e.target.value) || 0;
                                setBasePurchasePrice(value);
                                
                                // Immediately calculate secondary purchase price
                                const factor = getConversionFactor();
                                if (factor > 0) {
                                  const newPurchasePrice = value > 0 ? Math.round((value / factor) * 100) / 100 : 0;
                                  updateUnitPricing(0, 'purchasePrice', newPurchasePrice);
                                }
                              }}
                              className="pl-7 border-gray-300 rounded-md focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        {/* Selling Price */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Selling Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={baseSalePrice}
                              onChange={(e) => {
                                if (isUpdatingRef.current) return;
                                
                                const value = parseFloat(e.target.value) || 0;
                                setBaseSalePrice(value);
                                
                                // Immediately calculate secondary sale price
                                const factor = getConversionFactor();
                                if (factor > 0) {
                                  const newSalePrice = value > 0 ? Math.round((value / factor) * 100) / 100 : 0;
                                  updateUnitPricing(0, 'salePrice', newSalePrice);
                                }
                              }}
                              className="pl-7 border-gray-300 rounded-md focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        {/* Opening Quantity */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Opening Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            value={baseStockQuantity}
                            onChange={(e) => {
                              if (isUpdatingRef.current) return;
                              
                              const value = parseFloat(e.target.value) || 0;
                              setBaseStockQuantity(value);
                              
                              // Immediately calculate secondary opening quantity
                              const factor = getConversionFactor();
                              if (factor > 0) {
                                const newOpeningQuantity = value > 0 ? Math.round(value * factor * 100) / 100 : 0;
                                updateUnitPricing(0, 'openingQuantity', newOpeningQuantity);
                              }
                            }}
                            className="border-gray-300 rounded-md focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      {/* Link Icon */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <Link2 className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      {/* Secondary Unit Column */}
                      <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Secondary Unit ({units?.find((u: any) => u._id === unitPricings[0]?.secondaryUnitId)?.abbreviation.toUpperCase()})
                          </Label>
                        </div>
                        
                        {/* Purchase Price */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Purchase Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={unitPricings[0]?.purchasePrice || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                updateUnitPricing(0, 'purchasePrice', value);
                              }}
                              className="pl-7 border-gray-300 rounded-md focus:ring-blue-500 bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        {/* Selling Price */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Selling Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={unitPricings[0]?.salePrice || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                updateUnitPricing(0, 'salePrice', value);
                              }}
                              className="pl-7 border-gray-300 rounded-md focus:ring-blue-500 bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        {/* Opening Quantity */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Opening Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            value={unitPricings[0]?.openingQuantity || 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateUnitPricing(0, 'openingQuantity', value);
                            }}
                            className="border-gray-300 rounded-md focus:ring-blue-500 bg-white"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                 )}
                
                {!selectedBaseUnitId && (
                  <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded border border-yellow-200">
                    Please select a base unit to configure pricing.
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
