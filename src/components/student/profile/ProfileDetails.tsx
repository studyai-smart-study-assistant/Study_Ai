
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { User, Calendar } from 'lucide-react';
import { ProfileData } from '@/types/student';

interface ProfileDetailsProps {
  profileData: ProfileData;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profileData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-blue-500" />
          प्रोफाइल विवरण
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">श्रेणी</TableCell>
              <TableCell>{profileData.category === 'student' ? 'छात्र' : profileData.category}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">शिक्षा स्तर</TableCell>
              <TableCell>
                {profileData.education === 'high-school' ? 'हाई स्कूल' : 
                 profileData.education === 'intermediate' ? 'इंटरमीडिएट' : 
                 profileData.education === 'undergraduate' ? 'अंडरग्रेजुएट' : 
                 profileData.education === 'graduate' ? 'ग्रेजुएट' : 
                 profileData.education}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">शामिल हुए</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {new Date(profileData.joinedOn).toLocaleDateString('hi-IN')}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProfileDetails;
