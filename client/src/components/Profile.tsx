import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Profile() {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input type="text" id="name" defaultValue="John Doe" />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input type="email" id="email" defaultValue="john.doe@example.com" />
                        </div>
                        <Button type="submit">Update Profile</Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input type="password" id="current-password" />
                        </div>
                        <div>
                            <Label htmlFor="new-password">New Password</Label>
                            <Input type="password" id="new-password" />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input type="password" id="confirm-password" />
                        </div>
                        <Button type="submit">Change Password</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}