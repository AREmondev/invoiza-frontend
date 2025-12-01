"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUserStore } from "@/store/useUserStore";
import { ChargesSelector } from "@/components/shared/ChargesSelector";
import { BillingAliasSelector } from "@/components/shared/BillingAliasSelector";
import type { AdditionalCharge, BillingAlias } from "@/types/models";

export default function SettingsPage() {
  const { settings, updateSettings, addAdditionalCharge, updateAdditionalCharge, removeAdditionalCharge } = useSettingsStore();
  const { currentUser, hasPermission, getCurrentUserRoleName, userPermissions } = useUserStore();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSettingsChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    setHasChanges(true);
  };

  const handleChargeUpdate = (charge: AdditionalCharge) => {
    updateAdditionalCharge(charge.id, charge);
    setHasChanges(true);
  };

  const handleChargeRemove = (chargeId: string) => {
    removeAdditionalCharge(chargeId);
    setHasChanges(true);
  };

  const handleAddCharge = () => {
    const newCharge: AdditionalCharge = {
      id: `charge_${Date.now()}`,
      name: "New Charge",
      type: "percentage",
      value: 0,
      applyTo: "global",
      isActive: true,
      description: "",
      isTaxable: false,
      defaultEnabled: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser?.id || "system",
      updatedBy: currentUser?.id || "system",
      auditLogs: [],
    };
    addAdditionalCharge(newCharge);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasPermission("settings", "manage")) {
      alert("You don't have permission to manage settings");
      return;
    }

    setSaving(true);
    try {
      // Here you would typically save to your backend
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      // Here you would typically reset to default settings
      // For now, we'll just reload the page
      window.location.reload();
    }
  };

  if (!hasPermission("settings", "view")) {
    return (
      <div className="p-6 h-[calc(100vh-65px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to view settings. Contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Don't forget to save!
          </p>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="charges">Additional Charges</TabsTrigger>
          <TabsTrigger value="billing">Billing Aliases</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Agreements</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit & Logging</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={settings.businessName || ""}
                    onChange={(e) => handleSettingsChange("businessName", e.target.value)}
                    placeholder="Enter your business name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.currency || "BDT"}
                    onValueChange={(value) => handleSettingsChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">Bangladeshi Taka (৳)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone || "Asia/Dhaka"}
                    onValueChange={(value) => handleSettingsChange("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Dhaka">Asia/Dhaka</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.dateFormat || "dd/MM/yyyy"}
                    onValueChange={(value) => handleSettingsChange("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBackup">Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup your data daily
                    </p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={settings.autoBackup || false}
                    onCheckedChange={(checked) => handleSettingsChange("autoBackup", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for important events
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications || false}
                    onCheckedChange={(checked) => handleSettingsChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when products are running low on stock
                    </p>
                  </div>
                  <Switch
                    id="lowStockAlerts"
                    checked={settings.lowStockAlerts || false}
                    onCheckedChange={(checked) => handleSettingsChange("lowStockAlerts", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Additional Charges</CardTitle>
                <Button onClick={handleAddCharge}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                <ChargesSelector
                  appliedCharges={settings.additionalCharges.map(charge => ({
                    id: charge.id,
                    invoiceId: '',
                    additionalChargeId: charge.id,
                    name: charge.name,
                    type: charge.type,
                    value: charge.value,
                    applyTo: charge.applyTo === 'both' ? 'global' : charge.applyTo,
                    amountCents: 0,
                    isTaxable: charge.isTaxable,
                    lineItemIds: [],
                    createdAt: charge.createdAt,
                    updatedAt: charge.updatedAt,
                    createdBy: charge.createdBy,
                    updatedBy: charge.updatedBy,
                  }))}
                  onChargesChange={(charges) => {
                    // Convert back to AdditionalCharge format
                    const updatedCharges = charges.map(charge => ({
                      id: charge.additionalChargeId,
                      name: charge.name,
                      description: '',
                      type: charge.type,
                      value: charge.value,
                      applyTo: (charge.applyTo === 'global' ? 'both' : charge.applyTo) as 'per_line' | 'global' | 'both',
                      isTaxable: charge.isTaxable,
                      isActive: true,
                      defaultEnabled: false,
                      sortOrder: 0,
                      createdAt: charge.createdAt,
                      updatedAt: charge.updatedAt,
                      createdBy: charge.createdBy,
                      updatedBy: charge.updatedBy,
                      auditLogs: [],
                    }));
                    updateSettings({ additionalCharges: updatedCharges });
                  }}
                />
              </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charge Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowNegativeCharges">Allow Negative Charges</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow charges with negative values (discounts)
                  </p>
                </div>
                <Switch
                  id="allowNegativeCharges"
                  checked={settings.allowNegativeCharges || false}
                  onCheckedChange={(checked) => handleSettingsChange("allowNegativeCharges", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="chargeTaxOnCharges">Apply Tax on Charges</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply tax calculations on additional charges
                  </p>
                </div>
                <Switch
                  id="chargeTaxOnCharges"
                  checked={settings.chargeTaxOnCharges || false}
                  onCheckedChange={(checked) => handleSettingsChange("chargeTaxOnCharges", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Aliases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Billing Aliases</h4>
                  <Button
                    onClick={() => {
                      const newAlias = {
                        id: `alias_${Date.now()}`,
                        customerId: '', // Will be set when customer is selected
                        name: 'New Alias',
                        isDefault: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: currentUser?.id || 'system',
                        updatedBy: currentUser?.id || 'system',
                      };
                      const updatedAliases = [...settings.billingAliases, newAlias];
                      handleSettingsChange("billingAliases", updatedAliases);
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Alias
                  </Button>
                </div>
                
                {settings.billingAliases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No billing aliases configured.</p>
                ) : (
                  <div className="space-y-2">
                    {settings.billingAliases.map((alias, index) => (
                      <div key={alias.id} className="flex items-center gap-2 p-2 border rounded">
                        <Input
                          value={alias.name}
                          onChange={(e) => {
                            const updatedAliases = [...settings.billingAliases];
                            updatedAliases[index] = { ...alias, name: e.target.value };
                            handleSettingsChange("billingAliases", updatedAliases);
                          }}
                          placeholder="Alias name"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedAliases = settings.billingAliases.filter((_, i) => i !== index);
                            handleSettingsChange("billingAliases", updatedAliases);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Agreement Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enforcePriceAgreements">Enforce Price Agreements</Label>
                  <p className="text-sm text-muted-foreground">
                    Strictly enforce price agreements with customers
                  </p>
                </div>
                <Switch
                  id="enforcePriceAgreements"
                  checked={settings.enforcePriceAgreements || false}
                  onCheckedChange={(checked) => handleSettingsChange("enforcePriceAgreements", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceAgreementAction">Price Agreement Violation Action</Label>
                <Select
                  value={settings.priceAgreementAction || "warn"}
                  onValueChange={(value) => handleSettingsChange("priceAgreementAction", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn Only</SelectItem>
                    <SelectItem value="force">Allow with Warning</SelectItem>
                    <SelectItem value="abort">Prevent Sale</SelectItem>
                    <SelectItem value="use-fake-price">Use Fake Price</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  What to do when a price violates an agreement
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fakePriceThreshold">Fake Price Threshold (%)</Label>
                <Input
                  id="fakePriceThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.fakePriceThreshold || 10}
                  onChange={(e) => handleSettingsChange("fakePriceThreshold", parseFloat(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum percentage difference allowed before considering a price as "fake"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowBelowCostPricing">Allow Below-Cost Pricing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow selling products below their cost price
                  </p>
                </div>
                <Switch
                  id="allowBelowCostPricing"
                  checked={settings.allowBelowCostPricing || false}
                  onCheckedChange={(checked) => handleSettingsChange("allowBelowCostPricing", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumMarkupPercentage">Minimum Markup Percentage</Label>
                <Input
                  id="minimumMarkupPercentage"
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.minimumMarkupPercentage || 0}
                  onChange={(e) => handleSettingsChange("minimumMarkupPercentage", parseFloat(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum markup percentage required on sales
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Permission management is handled through the Roles & Permissions section.
                Contact your system administrator to modify role permissions.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span>Current Role:</span>
                  <span className="font-semibold">{getCurrentUserRoleName()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span>Permissions:</span>
                  <span className="text-sm text-muted-foreground">
                    {userPermissions?.length || 0} permissions
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit & Logging Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableAuditLogging">Enable Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all user actions and system events
                  </p>
                </div>
                <Switch
                  id="enableAuditLogging"
                  checked={settings.enableAuditLogging !== false}
                  onCheckedChange={(checked) => handleSettingsChange("enableAuditLogging", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auditLogRetention">Audit Log Retention (days)</Label>
                <Input
                  id="auditLogRetention"
                  type="number"
                  min="1"
                  max="3650"
                  value={settings.auditLogRetention || 90}
                  onChange={(e) => handleSettingsChange("auditLogRetention", parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Number of days to keep audit logs before automatic deletion
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="logPriceChanges">Log Price Changes</Label>
                  <p className="text-sm text-muted-foreground">
                  Track all price modifications for compliance
                  </p>
                </div>
                <Switch
                  id="logPriceChanges"
                  checked={settings.logPriceChanges || false}
                  onCheckedChange={(checked) => handleSettingsChange("logPriceChanges", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="logLoginAttempts">Log Login Attempts</Label>
                  <p className="text-sm text-muted-foreground">
                    Track all login attempts for security monitoring
                  </p>
                </div>
                <Switch
                  id="logLoginAttempts"
                  checked={settings.logLoginAttempts !== false}
                  onCheckedChange={(checked) => handleSettingsChange("logLoginAttempts", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}