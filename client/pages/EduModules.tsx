import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function EduModules() {
  const [activeModule, setActiveModule] = useState("prevention");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">Educational Modules</h1>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          Learn about waterborne diseases, prevention methods, treatment
          options, and access professional help.
        </p>
      </div>

      <Tabs
        value={activeModule}
        onValueChange={setActiveModule}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        {/* Prevention Module */}
        <TabsContent value="prevention" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚰 Water Purification
                  <Badge variant="secondary">Essential</Badge>
                </CardTitle>
                <CardDescription>
                  Learn safe water treatment methods to prevent waterborne
                  diseases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Boiling Water</h4>
                  <p className="text-sm text-foreground/80">
                    Boil water for at least 1 minute at a rolling boil. This
                    kills most bacteria, viruses, and parasites. Let it cool
                    before drinking. Store in clean, covered containers.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    Water Purification Tablets
                  </h4>
                  <p className="text-sm text-foreground/80">
                    Use chlorine or iodine tablets as directed. Wait the
                    recommended time before drinking. Effective against most
                    bacteria and viruses.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Filtration</h4>
                  <p className="text-sm text-foreground/80">
                    Use certified water filters or cloth filtration. Combine
                    with boiling for maximum safety. Clean filters regularly.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧼 Hygiene Practices
                  <Badge variant="secondary">Daily</Badge>
                </CardTitle>
                <CardDescription>
                  Essential hygiene habits to prevent contamination
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Hand Washing</h4>
                  <p className="text-sm text-foreground/80">
                    Wash hands with soap for 20 seconds before eating, after
                    using toilet, and after handling potentially contaminated
                    items.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Food Safety</h4>
                  <p className="text-sm text-foreground/80">
                    Cook food thoroughly, eat while hot, avoid raw vegetables in
                    areas with poor sanitation. "Cook it, peel it, or forget
                    it."
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Water Storage</h4>
                  <p className="text-sm text-foreground/80">
                    Store treated water in clean, covered containers. Use clean
                    utensils to access water. Don't put hands or dirty
                    containers into stored water.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🏠 Household Water Safety</CardTitle>
              <CardDescription>
                Creating a safe water environment at home
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">Source Protection</h4>
                  <ul className="text-sm text-foreground/80 space-y-1">
                    <li>• Keep wells covered and clean</li>
                    <li>• Maintain distance from toilets/sewage</li>
                    <li>• Regular source inspection</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Storage Safety</h4>
                  <ul className="text-sm text-foreground/80 space-y-1">
                    <li>• Use clean containers with lids</li>
                    <li>• Regular cleaning of storage tanks</li>
                    <li>• First-in, first-out principle</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Distribution</h4>
                  <ul className="text-sm text-foreground/80 space-y-1">
                    <li>• Clean pipes and taps regularly</li>
                    <li>• Avoid cross-contamination</li>
                    <li>• Monitor water quality regularly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📞 Water Emergency Contacts
                <Badge variant="outline">Keep Handy</Badge>
              </CardTitle>
              <CardDescription>
                Essential contacts for water-related emergencies and issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold text-blue-700">
                      Water Emergency Helpline
                    </h4>
                    <p className="text-2xl font-bold text-blue-600">1077</p>
                    <p className="text-sm text-foreground/70">
                      24/7 Water supply issues & contamination reports
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatment Module */}
        <TabsContent value="treatment" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 Recognizing Symptoms
                  <Badge variant="destructive">Important</Badge>
                </CardTitle>
                <CardDescription>
                  Early identification of waterborne disease symptoms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2 text-yellow-600">
                      Mild Symptoms
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Loose stools or mild diarrhea</li>
                      <li>• Stomach discomfort</li>
                      <li>• Mild nausea</li>
                      <li>• Fatigue</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">
                      Severe Symptoms (Seek Help Immediately)
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Severe dehydration</li>
                      <li>• Blood in stool</li>
                      <li>• High fever (&gt;101.5°F)</li>
                      <li>• Persistent vomiting</li>
                      <li>• Signs of shock</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💧 Rehydration Therapy</CardTitle>
                <CardDescription>
                  Managing dehydration from waterborne illnesses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">
                    Oral Rehydration Solution (ORS)
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Homemade ORS Recipe:</h5>
                    <ul className="text-sm space-y-1">
                      <li>• 1 liter of clean water</li>
                      <li>• 6 teaspoons of sugar</li>
                      <li>• 1/2 teaspoon of salt</li>
                      <li>• Mix well and give small, frequent sips</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">When to Use ORS</h4>
                  <p className="text-sm text-foreground/80">
                    Start ORS immediately when diarrhea begins. Give frequently
                    in small amounts. Adults: 200-400ml after each loose stool.
                    Children: 10-20ml per kg body weight after each stool.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🏥 When to Seek Medical Help</CardTitle>
                <CardDescription>
                  Critical signs that require professional medical attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 mb-2">
                      Immediate Medical Attention Required:
                    </h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      <li>
                        • Severe dehydration (dry mouth, no tears, sunken eyes)
                      </li>
                      <li>• Blood or mucus in stool</li>
                      <li>• High fever with chills</li>
                      <li>• Inability to keep fluids down</li>
                      <li>• Severe abdominal pain</li>
                      <li>• Signs of shock (rapid pulse, dizziness)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Recovery Tips</h4>
                    <ul className="text-sm text-foreground/80 space-y-1">
                      <li>• Continue fluids even if vomiting</li>
                      <li>• Rest and avoid solid foods initially</li>
                      <li>• Gradually reintroduce bland foods (BRAT diet)</li>
                      <li>• Avoid dairy, caffeine, and alcohol</li>
                      <li>• Follow medication instructions completely</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚨 Medical Emergency Contacts
                  <Badge variant="destructive">Life-Saving</Badge>
                </CardTitle>
                <CardDescription>
                  Call immediately when experiencing severe symptoms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-red-50">
                      <h4 className="font-semibold text-red-700">
                        Emergency Ambulance
                      </h4>
                      <p className="text-3xl font-bold text-red-600">108</p>
                      <p className="text-sm text-foreground/70">
                        24/7 Emergency Medical Services
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-green-50">
                      <h4 className="font-semibold text-green-700">
                        Health Helpline
                      </h4>
                      <p className="text-2xl font-bold text-green-600">104</p>
                      <p className="text-sm text-foreground/70">
                        Medical advice & consultation
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">Emergency Services</h4>
                      <p className="text-sm text-foreground/70">
                        Contact your local hospital or health center directly
                        for non-emergency medical care and infectious disease
                        treatment.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Videos Module */}
        <TabsContent value="videos" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📹 Educational Videos</CardTitle>
                <CardDescription>
                  Watch expert videos on water safety and health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/ix1BZzWisdg"
                        title="Waterborne Disease Prevention"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        Waterborne Disease Prevention
                      </h4>
                      <p className="text-sm text-foreground/70">
                        Comprehensive guide to preventing waterborne diseases
                        through proper hygiene and water safety practices.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/IisgnbMfKvI"
                        title="WHO Hand Hygiene Demonstration"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        WHO Hand Hygiene Demonstration
                      </h4>
                      <p className="text-sm text-foreground/70">
                        Official WHO demonstration of proper hand washing
                        techniques.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/cPWcnCOGMqg"
                        title="ORS at Home - Oral Rehydration Solution"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        ORS at Home - Oral Rehydration Solution
                      </h4>
                      <p className="text-sm text-foreground/70">
                        Step-by-step guide to prepare life-saving oral
                        rehydration solution at home.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/4C6mrmVUtdg"
                        title="Water Test Kit at Home"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div>
                      <h4 className="font-semibold">Water Test Kit at Home</h4>
                      <p className="text-sm text-foreground/70">
                        Learn how to use water testing kits at home to check
                        water quality and safety.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎯 Quick Reference Videos</CardTitle>
                <CardDescription>
                  Short clips for emergency situations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center space-y-2">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/4vyZ7jKpAvs"
                        title="Dehydration - Signs, Symptoms and Treatment"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <h5 className="font-semibold text-sm">
                      Dehydration - Signs, Symptoms and Treatment
                    </h5>
                    <p className="text-xs text-foreground/70">Quick guide</p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/Misq7MUutho"
                        title="Water Safety and Hygiene Practices"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <h5 className="font-semibold text-sm">
                      Water Safety and Hygiene Practices
                    </h5>
                    <p className="text-xs text-foreground/70">
                      Essential guide
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/tupJDf13jBo"
                        title="Disease Prevention - Health and Safety Tips"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <h5 className="font-semibold text-sm">
                      Disease Prevention - Health and Safety Tips
                    </h5>
                    <p className="text-xs text-foreground/70">
                      Prevention guide
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
